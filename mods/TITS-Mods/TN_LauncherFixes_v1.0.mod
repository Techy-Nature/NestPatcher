# TN_LauncherFixes v1.0 - NestPatcher mod. DESKTOP ONLY (Windows, Linux, Mac).
# Fixes bugs in the desktop launcher (the Electron main.js that sits next to
# main.<hash>.js once NestPatcher has unpacked app.asar). Android has no launcher,
# so leave this mod off there: a block it can't find stops the whole patch.
#   1. Reset game data failed with ENOTEMPTY once you had saves.
#   2. The image pack downloader saved 404/500 error pages as image files.
#   3. A failed or cut-off download left a broken half-file behind.
#   4. After a dropped connection, every later download in the batch failed.
#   5. The pack was marked fully installed even when files failed.
#   6. A damaged downloaded.json crashed the image check.
#   7. Cancel only stopped the current group of 500 files.
#   8. Download counters carried over between runs; a retry message checked the wrong list.
#   9. Messages to a closed window could crash; deprecated delete call; wrong file in a log line.
# The launcher runs before the game, so restart TiTS after patching.

# Launcher fix part 1 of 14
Replace [main.js]:
let win;

const PROTO_SCHEME = "tits";
With:
let win;

// Fix: the window can be gone (closed, or not created yet) when a message is sent.
function sendToWindow(channel, ...args)
{
	if (win && !win.isDestroyed())
	{
		win.webContents.send(channel, ...args);
	}
}

const PROTO_SCHEME = "tits";

# Launcher fix part 2 of 14
Replace [main.js]:
app.on("browser-window-focus", () => 
{
	win.webContents.send("display:triggerRedraw");
})
With:
app.on("browser-window-focus", () => 
{
	sendToWindow("display:triggerRedraw");
})

# Launcher fix part 3 of 14
Replace [main.js]:
if (fs.existsSync(GAME_DATA_PATH))
	{
		fs.rmdirSync(GAME_DATA_PATH);
	}
}
With:
if (fs.existsSync(GAME_DATA_PATH))
	{
		// Fix: rmdirSync throws ENOTEMPTY when saves exist, so reset never worked.
		fs.rmSync(GAME_DATA_PATH, { recursive: true, force: true });
	}
}

# Launcher fix part 4 of 14
Replace [main.js]:
if (fs.existsSync(backupPath))
		{
			console.log(`Loading file ${targetPath}`);
			fileData = fs.readFileSync(backupPath, { encoding: "utf8" });
			if (fileData)
With:
if (fs.existsSync(backupPath))
		{
			console.log(`Loading backup file ${backupPath}`);
			fileData = fs.readFileSync(backupPath, { encoding: "utf8" });
			if (fileData)

# Launcher fix part 5 of 14
Replace [main.js]:
function doRequest(s, target, uri)
{
	const fw = fs.createWriteStream(target);

	return new Promise((resolve, reject) => 
	{
		const path = (new URL(uri)).pathname;
		const req = s.request({ ":path": path });

		req.pipe(fw);

		fw.on("finish", () => 
		{
			fw.close();
			req.end();
			numTransferred++;
			win.webContents.send("acquireImages:notifyProgress", numTransferred);
			resolve(true);
		});

		req.on("error", (error) => 
		{
			console.log(error);
With:
function doRequest(s, target, uri)
{
	return new Promise((resolve, reject) => 
	{
		let settled = false;
		const fw = fs.createWriteStream(target);
		const path = (new URL(uri)).pathname;
		const req = s.request({ ":path": path });

		// Fix: a failed download used to leave a half-written file behind, and an error page
		// (404, 500...) was saved as if it were the image and counted as a success.
		const fail = (error) => 
		{
			if (settled) return;
			settled = true;
			console.log(error);

# Launcher fix part 6 of 14
Replace [main.js]:
imagesRequiringRetry.push({ target: target, source: uri });

			reject(error);
		});
	});
}
With:
imagesRequiringRetry.push({ target: target, source: uri });

			// Delete the partial file only once the file is closed, and settle only after that,
			// so a retry of the same file can't be deleted by this cleanup.
			const cleanUp = () => fs.rm(target, { force: true }, () => reject(error));
			if (fw.closed)
			{
				cleanUp();
			}
			else
			{
				fw.once("close", cleanUp);
				fw.destroy();
			}
		};

		req.on("response", (headers) => 
		{
			const status = headers[":status"];
			if (status !== 200)
			{
				req.close();
				fail(new Error(`Server answered ${status} for ${uri}`));
			}
		});

		req.pipe(fw);

		fw.on("finish", () => 
		{
			if (settled) return;
			settled = true;
			fw.close();
			req.end();
			numTransferred++;
			sendToWindow("acquireImages:notifyProgress", numTransferred);
			resolve(true);
		});

		req.on("error", fail);
		fw.on("error", fail);
	});
}

# Launcher fix part 7 of 14
Replace [main.js]:
// This realistically needs a good way to stall out the outer loop because we can shotgun every request into a failed half-open session otherwise...
	s.on("goaway", (__code, __sID, __data) =>
	{
		if (RECREATE_SESSION)
		{
			s = http2.connect(serverHost, connectionOptions);
		}
	});
With:
// This realistically needs a good way to stall out the outer loop because we can shotgun every request into a failed half-open session otherwise...
	// Fix: this used to reassign only the local "s", so the download loop kept using the dead session.
	// Now the shared session is swapped for a fresh one (which has its own error handler).
	s.on("goaway", (__code, __sID, __data) =>
	{
		if (RECREATE_SESSION && session === s)
		{
			session = createSession();
		}
	});

# Launcher fix part 8 of 14
Replace [main.js]:
downloadInProgress = true;
	const basePath = path.join(app.getPath("userData"), "ImagePack");
	console.log(`Base Path: ${basePath}`);
With:
downloadInProgress = true;
	// Fix: counters from an earlier run used to carry over into this one.
	numTransferred = 0;
	imagesRequiringRetry = null;
	const basePath = path.join(app.getPath("userData"), "ImagePack");
	console.log(`Base Path: ${basePath}`);

# Launcher fix part 9 of 14
Replace [main.js]:
await sleepWait(1000);
		}
	}
With:
await sleepWait(1000);
		}

		// Fix: cancelling used to stop only this chunk, then start the next one.
		if (cancelAcquisition)
		{
			break;
		}
	}

# Launcher fix part 10 of 14
Replace [main.js]:
}

	if (imagesRequiringRetry && imagesRequiringUpdate.length > 0)
	{
		console.log(`Retrying failed to acquire erroring files.`);
	}
With:
}

	// Fix: this checked imagesRequiringUpdate, so it logged even when every retry worked.
	if (imagesRequiringRetry && imagesRequiringRetry.length > 0)
	{
		console.log(`Retrying failed to acquire ${imagesRequiringRetry.length} erroring files.`);
	}

# Launcher fix part 11 of 14
Replace [main.js]:
else
	{
		let currentManifestHash = await getFileHash(path.join(app.getAppPath(), "image-manifest.json"));
		fs.writeFileSync(path.join(basePath, "downloaded.json"), JSON.stringify({ installed: true, manifestHash: currentManifestHash }));

		downloadInProgress = false;
		win.webContents.send("acquireImages:downloadComplete");
	}
}
With:
else
	{
		// Fix: only mark the pack as fully installed when every file arrived. Otherwise the
		// files that failed were never checked or downloaded again on later launches.
		if (!imagesRequiringRetry || imagesRequiringRetry.length === 0)
		{
			let currentManifestHash = await getFileHash(path.join(app.getAppPath(), "image-manifest.json"));
			fs.writeFileSync(path.join(basePath, "downloaded.json"), JSON.stringify({ installed: true, manifestHash: currentManifestHash }));
		}
		else
		{
			console.log(`${imagesRequiringRetry.length} files still missing; they will be checked again next time.`);
		}

		downloadInProgress = false;
		sendToWindow("acquireImages:downloadComplete");
	}
}

# Launcher fix part 12 of 14
Replace [main.js]:
if (fs.existsSync(markerPath))
	{
		const downloadedHash = JSON.parse(fs.readFileSync(markerPath));

		if (downloadedHash.manifestHash === manifestHash)
		{
			downloadedHashMatches = true;
With:
if (fs.existsSync(markerPath))
	{
		// Fix: a damaged downloaded.json used to throw here and stop the image check.
		let downloadedHash = null;
		try
		{
			downloadedHash = JSON.parse(fs.readFileSync(markerPath, "utf8"));
		}
		catch (e)
		{
			console.log(`Couldn't read ${markerPath}, checking every image again. ${e}`);
		}

		if (downloadedHash && downloadedHash.manifestHash === manifestHash)
		{
			downloadedHashMatches = true;

# Launcher fix part 13 of 14
Replace [main.js]:
if (fs.existsSync(folderPath))
	{
		fs.rmdirSync(folderPath, { recursive: true });
	}
}
With:
if (fs.existsSync(folderPath))
	{
		// Fix: rmdirSync with recursive is deprecated in newer Node/Electron.
		fs.rmSync(folderPath, { recursive: true, force: true });
	}
}

# Launcher fix part 14 of 14
Replace [main.js]:
{
	console.log(`Sending message to render process for ${numImages} images`);
	win.webContents.send("acquireImages:notifyAvailable", numImages, projectedSize);
}
With:
{
	console.log(`Sending message to render process for ${numImages} images`);
	sendToWindow("acquireImages:notifyAvailable", numImages, projectedSize);
}
