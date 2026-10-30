package com.techynest.nestpatcher

import android.Manifest
import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import android.provider.Settings
import android.text.InputType
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import java.io.File
import java.io.FileInputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * NestPatcher for Android. Not KittyPatcher; based on KittyPatcher by LibraKitty.
 *
 * Runs one of the NestPatcher .py scripts (the Android one by default) on your
 * TITS-Modding folder: PROJECT/extracted/apk/assets/www and PROJECT/mods.
 * Python runs through Chaquopy; the JavaScript check that needs Node.js on a PC
 * is done here by a hidden WebView (the phone's own Chromium engine).
 */
class MainActivity : AppCompatActivity() {

    private val prefs by lazy { getSharedPreferences("nestpatcher", MODE_PRIVATE) }

    private lateinit var root: LinearLayout
    private lateinit var page: ScrollView
    private lateinit var accessStatus: TextView
    private lateinit var folderInput: EditText
    private lateinit var folderStatus: TextView
    private lateinit var patcherSpinner: Spinner
    private lateinit var extraInput: EditText
    private lateinit var logView: TextView
    private lateinit var checkerView: WebView
    private lateinit var guiView: WebView
    private lateinit var guiBar: LinearLayout
    private val buttons = mutableListOf<Button>()
    private val texts = mutableListOf<Pair<TextView, Float>>()

    private var scripts = listOf<File>()
    private var running = false
    private var guiRunning = false
    private var guiUrl = ""

    // JavaScript checks handed from the Python thread to the WebView.
    private val checkFiles = ConcurrentHashMap<Int, String>()
    private val checkResults = ConcurrentHashMap<Int, String>()
    private val checkLatches = ConcurrentHashMap<Int, CountDownLatch>()
    private val checkIds = AtomicInteger(0)
    @Volatile private var checkerReady = false

    override fun onCreate(savedInstanceState: Bundle?) {
        applyTheme(prefs.getString("theme", "auto") ?: "auto")
        super.onCreate(savedInstanceState)
        if (!Python.isStarted()) Python.start(AndroidPlatform(this))
        scripts = installScripts()
        buildUi()
        refreshAccess()
        refreshFolder()
    }

    override fun onResume() {
        super.onResume()
        refreshAccess()
    }

    // ------------------------------------------------------------------ UI

    private fun dp(value: Int) = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

    private fun scale() = prefs.getFloat("scale", 1.0f)

    private fun text(content: String, size: Float = 16f, bold: Boolean = false): TextView {
        val view = TextView(this)
        view.text = content
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, size * scale())
        if (bold) view.setTypeface(view.typeface, Typeface.BOLD)
        view.setPadding(0, dp(6), 0, dp(2))
        view.setTextIsSelectable(true)
        texts.add(view to size)
        return view
    }

    private fun button(label: String, onClick: () -> Unit): Button {
        val view = Button(this)
        view.text = label
        view.isAllCaps = false
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f * scale())
        view.setOnClickListener { onClick() }
        texts.add(view to 16f)
        buttons.add(view)
        return view
    }

    private fun row(vararg views: View): LinearLayout {
        val layout = LinearLayout(this)
        layout.orientation = LinearLayout.HORIZONTAL
        layout.gravity = Gravity.CENTER_VERTICAL
        for (view in views) {
            layout.addView(view, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
        return layout
    }

    private fun input(hint: String): EditText {
        val view = EditText(this)
        view.hint = hint
        view.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f * scale())
        texts.add(view to 15f)
        return view
    }

    private fun section(title: String) = text(title, 19f, bold = true).also { it.setPadding(0, dp(18), 0, dp(4)) }

    private fun appVersionName(): String =
        try { packageManager.getPackageInfo(packageName, 0).versionName ?: "?" } catch (e: Exception) { "?" }

    @SuppressLint("SetJavaScriptEnabled")
    private fun buildUi() {
        root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL

        val content = LinearLayout(this)
        content.orientation = LinearLayout.VERTICAL
        content.setPadding(dp(16), dp(12), dp(16), dp(24))

        content.addView(text("NestPatcher", 24f, bold = true))
        content.addView(text("This is NestPatcher, not KittyPatcher. Based on KittyPatcher by LibraKitty. App v" +
            appVersionName(), 13f))

        val themeButton = button(themeLabel()) {}
        themeButton.setOnClickListener {
            val next = when (prefs.getString("theme", "auto")) { "auto" -> "dark"; "dark" -> "light"; else -> "auto" }
            prefs.edit().putString("theme", next).apply()
            applyTheme(next)
        }
        content.addView(row(
            button("A−") { setScale(scale() - 0.1f) },
            button("A+") { setScale(scale() + 0.1f) },
            themeButton))

        content.addView(section("1. File access"))
        accessStatus = text("")
        content.addView(accessStatus)
        content.addView(button("Allow file access") { askForAccess() })

        content.addView(section("2. Where you keep your files"))
        content.addView(text("Your TITS-Modding folder. Inside it NestPatcher expects extracted/apk/assets/www " +
            "(the unpacked game) and mods (enabled.txt plus your .mod / .js files).", 14f))
        folderInput = input("/storage/emulated/0/git.gay-repos/TITS-Modding")
        folderInput.setText(prefs.getString("project", "/storage/emulated/0/git.gay-repos/TITS-Modding"))
        content.addView(folderInput)
        content.addView(row(
            button("Choose folder…") { pickFolder() },
            button("Check folder") { saveFolder(); refreshFolder() }))
        folderStatus = text("", 14f)
        folderStatus.typeface = Typeface.MONOSPACE
        content.addView(folderStatus)

        content.addView(section("3. Which patcher"))
        content.addView(text("NestPatcher_TiTS_Android is the default. You can switch to any other NestPatcher " +
            "script, or load your own .py file.", 14f))
        patcherSpinner = Spinner(this)
        content.addView(patcherSpinner)
        fillSpinner()
        content.addView(button("Load a .py from my files…") { pickScript() })
        extraInput = input("Extra options (optional), e.g. --find shellyTalk")
        content.addView(extraInput)

        content.addView(section("4. Patch"))
        content.addView(text("Test changes nothing. Patch writes your mods into the unpacked game. " +
            "Afterwards rebuild and sign the TiTS APK as usual: this app doesn't sign APKs.", 14f))
        content.addView(row(
            button("Test my mods") { runPatcher("--dry-run") },
            button("Patch the game") { runPatcher("") }))

        content.addView(section("What happened"))
        content.addView(row(button("Copy log") { copyLog() }, button("Clear log") { logView.text = "" }))
        logView = text("", 13f)
        logView.typeface = Typeface.MONOSPACE
        content.addView(logView)

        page = ScrollView(this)
        page.isVerticalScrollBarEnabled = true
        page.isScrollbarFadingEnabled = false
        page.scrollBarStyle = View.SCROLLBARS_INSIDE_INSET
        page.addView(content)
        root.addView(page, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        // The GUI patcher shows here, full screen, when it's running.
        guiBar = LinearLayout(this)
        guiBar.orientation = LinearLayout.HORIZONTAL
        guiBar.addView(button("◀ Back to the app") { showGui(false) },
            LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        guiBar.visibility = View.GONE
        root.addView(guiBar)
        guiView = WebView(this)
        guiView.settings.javaScriptEnabled = true
        guiView.settings.domStorageEnabled = true
        guiView.webViewClient = WebViewClient()
        guiView.visibility = View.GONE
        root.addView(guiView, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        // Hidden 1x1 WebView used as the JavaScript syntax checker.
        checkerView = WebView(this)
        checkerView.settings.javaScriptEnabled = true
        checkerView.addJavascriptInterface(CheckerBridge(), "NestBridge")
        checkerView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val url = request.url
                if (url.host != "nest.local") return null
                return when (url.path) {
                    "/checker.html" -> WebResourceResponse("text/html", "utf-8", CHECKER_HTML.byteInputStream())
                    "/file" -> {
                        val id = url.getQueryParameter("id")?.toIntOrNull() ?: -1
                        val path = checkFiles[id] ?: return WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                            emptyMap(), "".byteInputStream())
                        WebResourceResponse("application/javascript", "utf-8", FileInputStream(path))
                    }
                    else -> null
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                checkerReady = true
            }
        }
        root.addView(checkerView, LinearLayout.LayoutParams(1, 1))
        checkerView.loadUrl("https://nest.local/checker.html")

        setContentView(root)
    }

    private fun themeLabel() = when (prefs.getString("theme", "auto")) {
        "dark" -> "Theme: Dark"; "light" -> "Theme: Light"; else -> "Theme: Auto"
    }

    private fun applyTheme(mode: String) {
        AppCompatDelegate.setDefaultNightMode(when (mode) {
            "dark" -> AppCompatDelegate.MODE_NIGHT_YES
            "light" -> AppCompatDelegate.MODE_NIGHT_NO
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        })
    }

    private fun setScale(value: Float) {
        val clamped = value.coerceIn(0.8f, 2.5f)
        prefs.edit().putFloat("scale", clamped).apply()
        for ((view, size) in texts) view.setTextSize(TypedValue.COMPLEX_UNIT_SP, size * clamped)
        toast("Text " + Math.round(clamped * 100) + "%")
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()

    private fun log(line: String) {
        logView.append(line + "\n")
        page.post { page.fullScroll(View.FOCUS_DOWN) }
    }

    private fun copyLog() {
        val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("NestPatcher log", logView.text))
        toast("Log copied")
    }

    // ------------------------------------------------------------------ files access

    private fun hasAccess(): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Environment.isExternalStorageManager()
        else checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED

    private fun refreshAccess() {
        if (!::accessStatus.isInitialized) return
        accessStatus.text = if (hasAccess()) "✓ NestPatcher can read and change your files."
        else "NestPatcher needs permission to read and change files in your TITS-Modding folder " +
            "(the unpacked game and your mods). Tap the button below, then turn on \"Allow access to manage all files\"."
    }

    private fun askForAccess() {
        if (hasAccess()) { refreshAccess(); return }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                startActivity(Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                    Uri.parse("package:$packageName")))
            } catch (e: Exception) {
                startActivity(Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION))
            }
        } else {
            requestPermissions(arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE), REQUEST_STORAGE)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        refreshAccess()
    }

    // ------------------------------------------------------------------ project folder

    private fun project() = folderInput.text.toString().trim().trimEnd('/')

    private fun saveFolder() = prefs.edit().putString("project", project()).apply()

    private fun pickFolder() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        startActivityForResult(intent, REQUEST_FOLDER)
    }

    /** Turn a folder picked in Android's file picker into a normal path Python can open. */
    private fun treeToPath(uri: Uri): String? {
        val docId = DocumentsContract.getTreeDocumentId(uri) ?: return null
        val parts = docId.split(":", limit = 2)
        val volume = parts[0]
        val rest = if (parts.size > 1) parts[1] else ""
        val base = if (volume.equals("primary", ignoreCase = true)) Environment.getExternalStorageDirectory().path
                   else "/storage/$volume"
        return if (rest.isEmpty()) base else "$base/$rest"
    }

    private fun refreshFolder() {
        val folder = project()
        if (folder.isEmpty()) { folderStatus.text = ""; return }
        Thread {
            val description = try {
                Python.getInstance().getModule("nest_android").callAttr("describe", folder).toString()
            } catch (e: Exception) { "Could not check: " + e.message }
            runOnUiThread { folderStatus.text = description }
        }.start()
    }

    // ------------------------------------------------------------------ patcher scripts

    /** Copy the bundled patchers out of the app so Python can open them as files. */
    private fun installScripts(): List<File> {
        val dir = File(filesDir, "patchers")
        dir.mkdirs()
        dir.listFiles()?.forEach { it.delete() }
        val names = assets.list("patchers")?.filter { it.endsWith(".py") }?.sorted() ?: emptyList()
        for (name in names) {
            assets.open("patchers/$name").use { input -> File(dir, name).outputStream().use { input.copyTo(it) } }
        }
        return names.map { File(dir, it) }
    }

    private fun customDir() = File(filesDir, "custom").also { it.mkdirs() }

    private fun allScripts(): List<File> {
        // The Mac patcher needs a TiTS.app bundle, so it can't run on a phone.
        val bundled = scripts.filter { !it.name.contains("_Mac_") }
        val custom = customDir().listFiles()?.filter { it.name.endsWith(".py") }?.sortedBy { it.name } ?: emptyList()
        val android = bundled.filter { it.name.startsWith("NestPatcher_TiTS_Android_v") }
        return android + (bundled - android.toSet()) + custom
    }

    private fun labelFor(file: File): String {
        val name = file.name
        return when {
            file.parentFile?.name == "custom" -> "Your file: $name"
            name.startsWith("NestPatcher_TiTS_Android_v") -> "Android (default): $name"
            name.contains("_GUI_") -> "GUI, opens inside the app: $name"
            name.contains("_Linux_") -> "Linux command-line: $name"
            name.contains("_Windows_") -> "Windows command-line: $name"
            else -> name
        }
    }

    private fun fillSpinner() {
        val list = allScripts()
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, list.map { labelFor(it) })
        patcherSpinner.adapter = adapter
        val saved = prefs.getString("script", "")
        val index = list.indexOfFirst { it.name == saved }.takeIf { it >= 0 } ?: 0
        patcherSpinner.setSelection(index)
        patcherSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                prefs.edit().putString("script", list[position].name).apply()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun pickScript() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
        intent.addCategory(Intent.CATEGORY_OPENABLE)
        intent.type = "*/*"
        startActivityForResult(intent, REQUEST_SCRIPT)
    }

    private fun importScript(uri: Uri) {
        var name = "custom_patcher.py"
        contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val column = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (column >= 0 && cursor.moveToFirst()) name = cursor.getString(column)
        }
        if (!name.endsWith(".py")) { toast("That isn't a .py file"); return }
        val target = File(customDir(), name.replace('/', '_'))
        contentResolver.openInputStream(uri)?.use { input -> target.outputStream().use { input.copyTo(it) } }
        prefs.edit().putString("script", target.name).apply()
        fillSpinner()
        toast("Loaded $name")
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        val uri = data?.data ?: return
        if (resultCode != RESULT_OK) return
        when (requestCode) {
            REQUEST_FOLDER -> {
                val path = treeToPath(uri)
                if (path == null) { toast("Couldn't read that folder's path. Type it in instead."); return }
                folderInput.setText(path)
                saveFolder()
                refreshFolder()
            }
            REQUEST_SCRIPT -> importScript(uri)
        }
    }

    // ------------------------------------------------------------------ running

    private fun selectedScript(): File? {
        val list = allScripts()
        return list.getOrNull(patcherSpinner.selectedItemPosition)
    }

    private fun runPatcher(flag: String) {
        if (running) { toast("Already running"); return }
        if (!hasAccess()) { toast("Allow file access first (step 1)"); return }
        val script = selectedScript() ?: run { toast("No patcher selected"); return }
        val folder = project()
        if (folder.isEmpty()) { toast("Choose your folder first (step 2)"); return }
        saveFolder()
        val isGui = script.name.contains("_GUI_")
        if (isGui && guiRunning) { showGui(true); return }
        val extra = (flag + " " + extraInput.text.toString()).trim()
        running = !isGui
        guiRunning = isGui
        setButtonsEnabled(isGui)
        log("── " + script.name + (if (extra.isEmpty()) "" else " $extra") + " ──")
        Thread {
            val code = try {
                Python.getInstance().getModule("nest_android")
                    .callAttr("run", script.path, folder, "auto", if (isGui) "" else extra, JsChecker(), LogSink())
                    .toInt()
            } catch (e: Exception) {
                runOnUiThread { log("App error: " + e.message) }
                1
            }
            runOnUiThread {
                log(if (code == 0) "✓ Finished." else "✗ Stopped (code $code). Nothing was changed if it says STOP, MISS or INVALID.")
                if (isGui) { guiRunning = false; showGui(false) }
                running = false
                setButtonsEnabled(true)
                refreshFolder()
            }
        }.start()
    }

    private fun setButtonsEnabled(enabled: Boolean) {
        for (b in buttons) b.isEnabled = enabled
    }

    private fun showGui(show: Boolean) {
        page.visibility = if (show) View.GONE else View.VISIBLE
        guiBar.visibility = if (show) View.VISIBLE else View.GONE
        guiView.visibility = if (show) View.VISIBLE else View.GONE
        if (show && guiUrl.isNotEmpty() && guiView.url == null) guiView.loadUrl(guiUrl)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (guiView.visibility == View.VISIBLE) {
            if (guiView.canGoBack()) guiView.goBack() else showGui(false)
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    /** Python calls line() for every line the patcher prints. */
    inner class LogSink {
        fun line(text: String) {
            runOnUiThread {
                log(text)
                val at = text.indexOf("http://127.0.0.1:")
                if (at >= 0 && text.contains("#k=")) {
                    guiUrl = text.substring(at).trim()
                    guiView.loadUrl(guiUrl)
                    showGui(true)
                }
            }
        }
    }

    /** Python calls check(path) instead of `node --check path`. "" means the JavaScript is fine. */
    inner class JsChecker {
        fun check(path: String): String {
            var waited = 0
            while (!checkerReady && waited < 100) { Thread.sleep(100); waited++ }
            val id = checkIds.incrementAndGet()
            val latch = CountDownLatch(1)
            checkFiles[id] = path
            checkLatches[id] = latch
            runOnUiThread { checkerView.evaluateJavascript("nestCheck($id)", null) }
            val finished = latch.await(300, TimeUnit.SECONDS)
            checkFiles.remove(id)
            checkLatches.remove(id)
            val result = checkResults.remove(id)
            return if (!finished) "timed out while checking the JavaScript" else (result ?: "")
        }
    }

    inner class CheckerBridge {
        @JavascriptInterface
        fun done(id: Int, error: String) {
            checkResults[id] = error
            checkLatches[id]?.countDown()
        }
    }

    companion object {
        private const val REQUEST_FOLDER = 1
        private const val REQUEST_SCRIPT = 2
        private const val REQUEST_STORAGE = 3

        // Parses the file without running it, like `node --check`.
        private const val CHECKER_HTML = """<!doctype html><html><body><script>
function nestCheck(id) {
  fetch('/file?id=' + id).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  }).then(function (source) {
    var error = '';
    try { new Function(source); } catch (e) { error = String(e); }
    NestBridge.done(id, error);
  }).catch(function (e) { NestBridge.done(id, 'could not read the file to check it: ' + e); });
}
</script></body></html>"""
    }
}
