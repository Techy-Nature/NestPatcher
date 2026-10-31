/* NestPatcher GUI launcher for Windows.
   Runs the bundled Python (runtime\python.exe) on the GUI script in
   runtime\app\, points it at the bundled Node.js (runtime\node\node.exe), and
   tells it to keep nestmods\ and settings next to this .exe. */
#include <windows.h>
#include <wchar.h>

/* packaging/build_bundles.sh passes the real name, e.g. -DSCRIPT=L\"NestPatcher_TiTS_GUI_v0.7.py\" */
#ifndef SCRIPT
#define SCRIPT L"NestPatcher_TiTS_GUI.py"
#endif

int wmain(void)
{
    wchar_t dir[MAX_PATH], python[MAX_PATH], script[MAX_PATH], cmd[3 * MAX_PATH + 600];
    DWORD n = GetModuleFileNameW(NULL, dir, MAX_PATH);
    if (n == 0 || n >= MAX_PATH) return 1;
    wchar_t *slash = wcsrchr(dir, L'\\');
    if (slash) *slash = L'\0';

    _snwprintf(python, MAX_PATH, L"%ls\\runtime\\python.exe", dir);
    _snwprintf(script, MAX_PATH, L"%ls\\runtime\\app\\%ls", dir, SCRIPT);
    if (GetFileAttributesW(python) == INVALID_FILE_ATTRIBUTES ||
        GetFileAttributesW(script) == INVALID_FILE_ATTRIBUTES) {
        MessageBoxW(NULL,
            L"The runtime folder is missing.\n\nUnzip the whole NestPatcher folder first, "
            L"and keep NestPatcher's .exe next to its runtime folder.",
            L"NestPatcher", MB_ICONERROR);
        return 1;
    }
    SetEnvironmentVariableW(L"NESTPATCHER_HOME", dir);
    wchar_t node[MAX_PATH];
    _snwprintf(node, MAX_PATH, L"%ls\\runtime\\node\\node.exe", dir);
    if (GetFileAttributesW(node) != INVALID_FILE_ATTRIBUTES)
        SetEnvironmentVariableW(L"NESTPATCHER_NODE", node);
    /* Pass on anything typed after the .exe name (e.g. --no-browser --port=8765). */
    const wchar_t *rest = GetCommandLineW();
    if (*rest == L'"') {
        rest++;
        while (*rest && *rest != L'"') rest++;
        if (*rest) rest++;
    } else {
        while (*rest && *rest != L' ' && *rest != L'\t') rest++;
    }
    while (*rest == L' ' || *rest == L'\t') rest++;
    if (wcslen(rest) > 512) rest = L"";
    _snwprintf(cmd, sizeof(cmd) / sizeof(cmd[0]), L"\"%ls\" -I \"%ls\" %ls", python, script, rest);

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));
    SetConsoleTitleW(L"NestPatcher (keep this window open while you use it)");
    if (!CreateProcessW(python, cmd, NULL, NULL, TRUE, 0, NULL, dir, &si, &pi)) {
        MessageBoxW(NULL, L"Could not start the bundled Python.", L"NestPatcher", MB_ICONERROR);
        return 1;
    }
    WaitForSingleObject(pi.hProcess, INFINITE);
    DWORD code = 0;
    GetExitCodeProcess(pi.hProcess, &code);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return (int)code;
}
