import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { invoke, inTauri, tryInvoke, tryInvokeOk } from "@/lib/tauri";
import { useDotnetStore } from "@/stores/dotnet";
import { pushToast } from "@/stores/toasts";
import { useUpdaterStore } from "@/stores/updater";
import { useAppStore, ThemeCode } from "@/stores/app";
import { TaskPhase, useTasksStore } from "@/stores/tasks";
import { useInstalledStore } from "@/stores/installed";
import { useSteamSessionStore, SteamAccountInfo } from "@/stores/steam-session";
import i18n, { SupportedLanguage } from "@/i18n";
import { maybeMinimize } from "@/lib/window";

export function useBootstrap() {
  const dotnetInitialized = useRef(false);

  useEffect(() => {
    void (async () => {
      if (!inTauri) {
        useAppStore.setState({ ready: true });
        return;
      }
      const config = await tryInvoke<Record<string, unknown>>("config_get_all");
      const availableLanguages = await tryInvoke<{ code: string; label: string }[]>("i18n_get_available_languages", undefined, []);
      const weDirectory = await tryInvoke<string | null>("we_get_directory", undefined, null);
      const accountIndex = await tryInvoke<number>("config_get", { path: "settings.account.account.account_number" }, 0);
      const infiniteRetryAccounts = await tryInvoke<boolean>("config_get", { path: "settings.account.account.infinite_retry_accounts" }, false);
      const accounts = await tryInvoke<{ index: number; username: string; is_custom: boolean }[]>("accounts_list", undefined, []);
      const savedLanguage = getConfigValue<string | null>(config, ["general", "appearance", "language"], null);
      const language = savedLanguage ?? detectSystemLanguage();
      void i18n.changeLanguage(language);
      if (!savedLanguage) {
        void invoke("config_set", { path: "settings.general.appearance.language", value: language }).catch(() => undefined);
      }
      const appearance = getConfigValue<Record<string, unknown>>(config, ["general", "appearance"], {});
      const patch: Record<string, unknown> = {
        weDirectory: weDirectory ?? "", availableLanguages: availableLanguages ?? [],
        accountIndex: typeof accountIndex === "number" ? accountIndex : 0,
        infiniteRetryAccounts: typeof infiniteRetryAccounts === "boolean" ? infiniteRetryAccounts : false,
        accounts: accounts ?? [], language, ready: true,
      };
      if (appearance.theme) patch.theme = appearance.theme as ThemeCode;
      if (appearance.accent) patch.accent = appearance.accent as string;
      useAppStore.setState(patch);
      void syncSteamSession();
      void invoke("app_restore_window_geometry").then(() => invoke("app_show_main_window")).catch(() => { void invoke("app_show_main_window").catch(() => undefined); });
      void maybeCheckForUpdates();
      if (!dotnetInitialized.current) {
        dotnetInitialized.current = true;
        void invoke("dotnet_init").catch(() => undefined);
        void invoke("plugins_init").catch(() => undefined);
      }
      void registerWindowStatePersistence();
      void useInstalledStore.getState().refresh();
      await Promise.all([
        listen<{ phase: string; message: string; progress?: number | null }>("dotnet://status", (event) => useDotnetStore.getState().setStatus({ phase: event.payload.phase as any, message: event.payload.message, progress: event.payload.progress ?? null })),
        listen<{ phase: string; plugin_id: string; plugin_name: string; message: string; progress?: number | null }>("plugin://status", (event) => useDotnetStore.getState().setPluginStatus({ phase: event.payload.phase as any, plugin_id: event.payload.plugin_id, plugin_name: event.payload.plugin_name, message: event.payload.message, progress: event.payload.progress ?? null })),
        listen<{ pubfileid: string; status: string; account: string; phase: string; progress?: number | null }>("download://status", (event) => {
          const normalizedPhase = normalizeTaskPhase(event.payload.phase);
          useTasksStore.getState().upsert({ ...event.payload, kind: "download", phase: normalizedPhase });
          if (normalizedPhase === "failed") pushToast(i18n.t("bootstrap.download_failed", { id: event.payload.pubfileid, status: event.payload.status }), "error");
          else if (normalizedPhase === "cancelled") pushToast(i18n.t("bootstrap.download_cancelled", { id: event.payload.pubfileid }), "warning");
          else if (normalizedPhase === "completed") { pushToast(i18n.t("bootstrap.download_completed", { id: event.payload.pubfileid }), "success"); void useInstalledStore.getState().refresh(); void maybeAutoApply(event.payload.pubfileid); }
        }),
        listen<{ payload: string }>("download://require_app_confirm", () => pushToast(i18n.t("bootstrap.download_failed", { id: "Steam", status: "请在 Steam 手机应用中确认登录" }), "info")),
        listen<{ pubfileid: string; status: string; account: string; phase: string; progress?: number | null }>("extract://status", (event) => {
          const normalizedPhase = normalizeTaskPhase(event.payload.phase);
          useTasksStore.getState().upsert({ ...event.payload, kind: "extract", phase: normalizedPhase });
          if (normalizedPhase === "failed") pushToast(i18n.t("bootstrap.extract_failed", { id: event.payload.pubfileid, status: event.payload.status }), "error");
          else if (normalizedPhase === "completed") pushToast(i18n.t("bootstrap.extract_completed", { id: event.payload.pubfileid }), "success");
        }),
      ]);
    })();
  }, []);
}

function detectSystemLanguage(): SupportedLanguage {
  const browserLang = navigator.language ?? navigator.languages?.[0] ?? undefined;
  if (!browserLang) return "en";
  const code = browserLang.split(/[-_]/)[0]?.toLowerCase();
  const supported: SupportedLanguage[] = ["en", "ru", "zh"];
  return supported.includes(code as SupportedLanguage) ? (code as SupportedLanguage) : "en";
}

function getConfigValue<T>(config: Record<string, unknown> | null | undefined, path: string[], fallback: T): T {
  let current: unknown = config;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !Object.prototype.hasOwnProperty.call(current, key)) return fallback;
    current = (current as Record<string, unknown>)[key];
  }
  return current === undefined || current === null ? fallback : (current as T);
}

function normalizeTaskPhase(value: string): TaskPhase {
  if (value === "starting" || value === "running" || value === "completed" || value === "failed" || value === "cancelled") return value;
  return "running";
}

export async function changeLanguageTo(code: string) {
  useAppStore.setState({ language: code });
  await i18n.changeLanguage(code);
  if (inTauri) {
    await invoke<void>("config_set", { path: "settings.general.appearance.language", value: code }).catch(() => undefined);
    await invoke<void>("i18n_set_language", { language: code }).catch(() => undefined);
  }
}

interface UpdateInfo { current_version: string; latest_version: string; update_available: boolean; release_notes: string; html_url: string; error: string | null; }

async function syncSteamSession() {
  const session = useSteamSessionStore.getState();
  if (!inTauri) { session.setPhase("idle"); return; }
  session.setLoggingIn();
  try {
    let info = await tryInvoke<SteamAccountInfo | null>("steam_current_account", undefined, null);
    if (info) { session.setLoggedIn(info); return; }
    let ok = await tryInvoke<boolean>("steam_auto_login", { accountIndex: null }, false);
    if (ok) {
      info = await tryInvoke<SteamAccountInfo | null>("steam_current_account", undefined, null);
      if (info) { session.setLoggedIn(info); return; }
      ok = await tryInvoke<boolean>("steam_auto_login", { accountIndex: null, force: true }, false);
    }
    if (ok) { info = await tryInvoke<SteamAccountInfo | null>("steam_current_account", undefined, null); session.setLoggedIn(info ?? null); }
    else session.setError();
  } catch { session.setError(); }
}

async function maybeCheckForUpdates() {
  if (!inTauri) return;
  const enabled = await tryInvoke<boolean>("config_get", { path: "settings.general.behavior.auto_check_updates" }, true);
  if (!enabled) return;
  const info = await tryInvoke<UpdateInfo>("updater_check", undefined);
  if (info?.update_available) useUpdaterStore.getState().show(info);
}

async function maybeAutoApply(pubfileid: string) {
  if (!inTauri || !pubfileid) return;
  const enabled = await tryInvoke<boolean>("config_get", { path: "settings.general.behavior.auto_apply_last_downloaded" }, false);
  if (!enabled) return;
  type Installed = { pubfileid: string; project_json_path: string };
  const installed = await tryInvoke<Installed[]>("we_list_installed", undefined, []);
  const match = (installed ?? []).find((w) => w.pubfileid === pubfileid);
  if (!match) return;
  const ok = await tryInvokeOk("we_apply", { projectPath: match.project_json_path, monitor: null, force: false });
  if (ok) void maybeMinimize();
}

async function registerWindowStatePersistence() {
  if (!inTauri) return;
  try {
    const win = getCurrentWindow();
    const save = async () => {
      const enabled = await tryInvoke<boolean>("config_get", { path: "settings.general.behavior.save_window_state" }, true);
      if (!enabled) return;
      const pos = await win.outerPosition();
      if (pos.x < -30000 || pos.y < -30000) return;
      const [size, maximized] = await Promise.all([win.outerSize(), win.isMaximized()]);
      void invoke("app_save_window_geometry", { geom: { x: pos.x, y: pos.y, width: size.width, height: size.height, is_maximized: Boolean(maximized) } });
    };
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedSave = () => { if (saveTimeout) clearTimeout(saveTimeout); saveTimeout = setTimeout(() => { void save(); }, 500); };
    await win.onResized(() => debouncedSave());
    await win.onMoved(() => debouncedSave());
  } catch (err) { console.warn("window state persistence setup failed", err); }
}
