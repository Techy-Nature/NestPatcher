# TN_LauncherFixes v1.1 - NestPatcher mod. DESKTOP ONLY (Windows, Linux, Mac).
# Fixes bugs in the desktop launcher (the Electron main.js that sits next to
# main.<hash>.js once NestPatcher has unpacked app.asar). Android has no launcher,
# so leave this mod off there: a block it can't find stops the whole patch.
# Patch the STOCK main.js. If you copied a hand-patched main.js over it (for example
# the ImagePack "Revision 2" or "Revision 3" files), put the original back first.
#   1. Reset game data failed with ENOTEMPTY once you had saves.
#   2. ImagePack downloads now use plain HTTPS (HTTP/1.1) with up to 6 connections,
#      not one shared HTTP/2 connection. That connection kept failing with
#      ERR_HTTP2_ERROR, and every later download failed with it. (New in v1.1.)
#   3. A download that sends nothing for 60 seconds fails and is retried, instead of
#      hanging. 6 files download at a time instead of 10. (New in v1.1.)
#   4. The image pack downloader saved 404/500 error pages as image files.
#   5. A failed or cut-off download left a broken half-file behind.
#   6. The pack was marked fully installed even when files failed; an old marker is
#      now removed when files are still missing.
#   7. A damaged downloaded.json crashed the image check.
#   8. Cancel only stopped the current group of 500 files.
#   9. Download counters carried over between runs; a retry message checked the wrong list.
#  10. Messages to a closed window could crash; deprecated delete call; wrong file in a log line.
# The launcher runs before the game, so restart TiTS after patching.

# Launcher fix part 1 of 10
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

# Launcher fix part 2 of 10
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

# Launcher fix part 3 of 10
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

# Launcher fix part 4 of 10
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

# Launcher fix part 5 of 10
Replace [main.js]:
const http2 = require("http2");
With:
// Fix (ImagePack downloads): HTTPS (HTTP/1.1) instead of HTTP/2, see below.
const https = require("https");

# Launcher fix part 6 of 10
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

			if (!imagesRequiringRetry)
			{
				imagesRequiringRetry = [];
			}

			imagesRequiringRetry.push({ target: target, source: uri });

			reject(error);
		});
	});
}

let RECREATE_SESSION = false;

function createSession()
{
	let s = http2.connect(serverHost, connectionOptions);
	RECREATE_SESSION = true;

	s.on("error", (error) =>
	{
		console.log(error);
	});

	// This realistically needs a good way to stall out the outer loop because we can shotgun every request into a failed half-open session otherwise...
	s.on("goaway", (__code, __sID, __data) =>
	{
		if (RECREATE_SESSION)
		{
			s = http2.connect(serverHost, connectionOptions);
		}
	});

	return s;
}

function closeSession(s)
{
	RECREATE_SESSION = false;
	s.close();
}
With:
// Fix (ImagePack downloads): the image pack used to come down one shared HTTP/2 connection.
// When the server reset it (ERR_HTTP2_ERROR), every download after that failed as well, and
// a stuck download could hang the whole run. Downloads now use plain HTTPS (HTTP/1.1) through
// a small pool of at most 6 connections, so one bad connection only fails its own file.
const REQUEST_TIMEOUT_MS = 60000;
let imageHttpsAgent = null;

function getImageAgent()
{
	if (!imageHttpsAgent)
	{
		imageHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 6, maxFreeSockets: 2 });
	}
	return imageHttpsAgent;
}

function closeImageAgent()
{
	if (imageHttpsAgent)
	{
		imageHttpsAgent.destroy();
		imageHttpsAgent = null;
	}
}

function doRequest(target, uri)
{
	return new Promise((resolve, reject) =>
	{
		const fw = fs.createWriteStream(target);
		let req = null;
		let response = null;
		let settled = false;
		let requestTimeout = null;

		const clearRequestTimeout = () =>
		{
			if (requestTimeout)
			{
				clearTimeout(requestTimeout);
				requestTimeout = null;
			}
		};

		// Fix: a download that stops sending data for 60 seconds now fails (and is retried)
		// instead of waiting forever.
		const resetRequestTimeout = () =>
		{
			clearRequestTimeout();
			requestTimeout = setTimeout(() =>
			{
				fail(new Error(`Timed out downloading ${uri}: no data for ${REQUEST_TIMEOUT_MS / 1000} seconds.`));
			}, REQUEST_TIMEOUT_MS);
		};

		// Fix: a failed download used to leave a half-written file behind, and an error page
		// (404, 500...) was saved as if it were the image and counted as a success.
		const fail = (error) =>
		{
			if (settled) return;
			settled = true;
			clearRequestTimeout();
			console.log(`Image download failed: ${uri}`, error);

			if (!imagesRequiringRetry)
			{
				imagesRequiringRetry = [];
			}
			imagesRequiringRetry.push({ target: target, source: uri });

			if (response && !response.destroyed)
			{
				response.destroy();
			}
			if (req && !req.destroyed)
			{
				req.destroy();
			}

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

		fw.on("error", fail);
		fw.on("finish", () =>
		{
			if (settled) return;
			settled = true;
			clearRequestTimeout();
			fw.close();
			numTransferred++;
			sendToWindow("acquireImages:notifyProgress", numTransferred);
			resolve(true);
		});

		try
		{
			// connectionOptions keeps the test-server setting (self-signed certificate) when USE_PROD is false.
			req = https.get(uri, { ...connectionOptions, agent: getImageAgent() }, (res) =>
			{
				response = res;
				const status = res.statusCode;
				if (typeof status !== "number" || status < 200 || status >= 300)
				{
					res.resume();
					fail(new Error(`Server answered ${status || "with no status"} for ${uri}`));
					return;
				}

				res.on("data", resetRequestTimeout);
				res.on("aborted", () => fail(new Error(`Download cut off: ${uri}`)));
				res.on("error", fail);
				res.on("close", () =>
				{
					if (!res.complete)
					{
						fail(new Error(`Download cut off: ${uri}`));
					}
				});
				res.pipe(fw);
				resetRequestTimeout();
			});

			req.on("error", fail);
			resetRequestTimeout();
		}
		catch (error)
		{
			fail(error);
		}
	});
}

# Launcher fix part 7 of 10
Replace [main.js]:
async function handleAcquireImages()
{
	if (imagesRequiringUpdate === null || imagesRequiringUpdate.length === 0)
	{
		return false;
	}

	const sleepWait = ms => new Promise(r => setTimeout(r, ms));

	downloadInProgress = true;
	const basePath = path.join(app.getPath("userData"), "ImagePack");
	console.log(`Base Path: ${basePath}`);

	try
	{
		fs.mkdirSync(basePath);
	}
	catch (error)
	{
		if (error.code !== "EEXIST")
		{
			throw error;
		}
	}

	let requestTasks = [];
	const concurrencyLimit = 10;
	let fileId = 0;

	const chunkSize = 500;
	let chunkedList = [];

	for (let i = 0; i < imagesRequiringUpdate.length; i += chunkSize)
	{
		chunkedList.push(imagesRequiringUpdate.slice(i, i + chunkSize));
	}

	for (const chunk of chunkedList)
	{
		session = createSession();

		for (const i of chunk)
		{
			if (requestTasks.length >= concurrencyLimit)
			{
				await Promise.race(requestTasks);
			}

			console.log(`Downloading asset [${fileId++}] ${i.source}`);

			// Ensure the target folder exists

			if (cancelAcquisition)
			{
				break;
			}
			
			await fs.promises.mkdir(path.dirname(i.target), { recursive: true });
			const oneRequest = doRequest(session, i.target, i.source).then(() => 
			{
				requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
			}).catch(() => 
			{
				requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
			})
			requestTasks.push(oneRequest);
		}

		closeSession(session);
		while (!session.closed)
		{
			console.log("Waiting to recycle session...");
			await sleepWait(1000);
		}
	}

	console.log("Waiting for in-flight requests...");
	await Promise.all(requestTasks);	

	// If we have ANY failures, recreate the session and commence trying again
	if (imagesRequiringRetry && imagesRequiringRetry.length > 0)
	{
		closeSession(session);
		session = createSession();

		const retryCount = 2;
		for (let i = 0; i < retryCount; i++)
		{
			let failingListCopy = imagesRequiringRetry;
			imagesRequiringRetry = [];

			if (!Array.isArray(failingListCopy) || failingListCopy.length === 0)
			{
				console.log("There are no active elements to retry, aborting.")
				break;
			}

			for (const i of failingListCopy)
			{
				if (requestTasks.length >= concurrencyLimit)
				{
					await Promise.race(requestTasks);
				}

				console.log(`Retrying asset [${fileId}] ${i.source}`);

				if (cancelAcquisition)
				{
					break;
				}

				await fs.promises.mkdir(path.dirname(i.target), { recursive: true });
				const oneRequest = doRequest(session, i.target, i.source).then(() => 
				{
					requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
				}).catch(() => 
				{
					requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
				});
				requestTasks.push(oneRequest);
			}

			await Promise.all(requestTasks);

			if (imagesRequiringRetry && imagesRequiringRetry.length === 0)
			{
				console.log(`Retry ${i + 1} acquired all remaining files.`);
				break;
			}
		}
	}

	if (imagesRequiringRetry && imagesRequiringUpdate.length > 0)
	{
		console.log(`Retrying failed to acquire erroring files.`);
	}

	if (session)
	{
		closeSession(session);
		session = null;
	}

	console.log("Requests complete.");

	if (cancelAcquisition)
	{
		cancelAcquisition = false;
		downloadInProgress = false;

		// If we cancel, we'll have files we already downloaded so we should clear the cached list and recreate it
		imagesRequiringUpdate = null;
		numTransferred = 0;
		checkImageManifest();
	}
	else
	{
		let currentManifestHash = await getFileHash(path.join(app.getAppPath(), "image-manifest.json"));
		fs.writeFileSync(path.join(basePath, "downloaded.json"), JSON.stringify({ installed: true, manifestHash: currentManifestHash }));

		downloadInProgress = false;
		win.webContents.send("acquireImages:downloadComplete");
	}
}
With:
async function handleAcquireImages()
{
	if (imagesRequiringUpdate === null || imagesRequiringUpdate.length === 0)
	{
		return false;
	}

	downloadInProgress = true;
	// Fix: counters from an earlier run used to carry over into this one.
	numTransferred = 0;
	imagesRequiringRetry = null;
	const basePath = path.join(app.getPath("userData"), "ImagePack");
	console.log(`Base Path: ${basePath}`);

	try
	{
		fs.mkdirSync(basePath);
	}
	catch (error)
	{
		if (error.code !== "EEXIST")
		{
			throw error;
		}
	}

	let requestTasks = [];
	// Fix (ImagePack downloads): 6 files at a time instead of 10, to match the 6 connections.
	const concurrencyLimit = 6;
	let fileId = 0;

	const chunkSize = 500;
	let chunkedList = [];

	for (let i = 0; i < imagesRequiringUpdate.length; i += chunkSize)
	{
		chunkedList.push(imagesRequiringUpdate.slice(i, i + chunkSize));
	}

	for (const chunk of chunkedList)
	{
		for (const i of chunk)
		{
			if (requestTasks.length >= concurrencyLimit)
			{
				await Promise.race(requestTasks);
			}

			console.log(`Downloading asset [${fileId++}] ${i.source}`);

			// Ensure the target folder exists

			if (cancelAcquisition)
			{
				break;
			}
			
			await fs.promises.mkdir(path.dirname(i.target), { recursive: true });
			const oneRequest = doRequest(i.target, i.source).then(() => 
			{
				requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
			}).catch(() => 
			{
				requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
			})
			requestTasks.push(oneRequest);
		}

		// Finish this group of 500 before starting the next one.
		await Promise.all(requestTasks);
		requestTasks = [];

		// Fix: cancelling used to stop only this chunk, then start the next one.
		if (cancelAcquisition)
		{
			break;
		}
	}

	console.log("Waiting for in-flight requests...");
	await Promise.all(requestTasks);	

	// If we have ANY failures, try those files again (twice at most)
	if (imagesRequiringRetry && imagesRequiringRetry.length > 0 && !cancelAcquisition)
	{
		const retryCount = 2;
		for (let i = 0; i < retryCount; i++)
		{
			let failingListCopy = imagesRequiringRetry;
			imagesRequiringRetry = [];

			if (!Array.isArray(failingListCopy) || failingListCopy.length === 0)
			{
				console.log("There are no active elements to retry, aborting.")
				break;
			}

			for (const i of failingListCopy)
			{
				if (requestTasks.length >= concurrencyLimit)
				{
					await Promise.race(requestTasks);
				}

				console.log(`Retrying asset [${fileId}] ${i.source}`);

				if (cancelAcquisition)
				{
					break;
				}

				await fs.promises.mkdir(path.dirname(i.target), { recursive: true });
				const oneRequest = doRequest(i.target, i.source).then(() => 
				{
					requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
				}).catch(() => 
				{
					requestTasks.splice(requestTasks.indexOf(oneRequest), 1);
				});
				requestTasks.push(oneRequest);
			}

			await Promise.all(requestTasks);

			if (imagesRequiringRetry && imagesRequiringRetry.length === 0)
			{
				console.log(`Retry ${i + 1} acquired all remaining files.`);
				break;
			}

			if (cancelAcquisition)
			{
				break;
			}
		}
	}

	// Fix: this checked imagesRequiringUpdate, so it logged even when every retry worked.
	if (imagesRequiringRetry && imagesRequiringRetry.length > 0)
	{
		console.log(`Retrying failed to acquire ${imagesRequiringRetry.length} erroring files.`);
	}

	// Close the download connections.
	closeImageAgent();

	console.log("Requests complete.");

	if (cancelAcquisition)
	{
		cancelAcquisition = false;
		downloadInProgress = false;

		// If we cancel, we'll have files we already downloaded so we should clear the cached list and recreate it
		imagesRequiringUpdate = null;
		numTransferred = 0;
		checkImageManifest();
	}
	else
	{
		// Fix: only mark the pack as fully installed when every file arrived. Otherwise the
		// files that failed were never checked or downloaded again on later launches.
		const markerPath = path.join(basePath, "downloaded.json");
		if (!imagesRequiringRetry || imagesRequiringRetry.length === 0)
		{
			let currentManifestHash = await getFileHash(path.join(app.getAppPath(), "image-manifest.json"));
			fs.writeFileSync(markerPath, JSON.stringify({ installed: true, manifestHash: currentManifestHash }));
		}
		else
		{
			// An old "installed" marker would hide the missing files on the next launch, so remove it.
			fs.rmSync(markerPath, { force: true });
			console.log(`${imagesRequiringRetry.length} files still missing; they will be checked again next time.`);
		}

		downloadInProgress = false;
		sendToWindow("acquireImages:downloadComplete");
	}
}

# Launcher fix part 8 of 10
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

# Launcher fix part 9 of 10
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

# Launcher fix part 10 of 10
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
