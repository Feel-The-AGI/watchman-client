export const MASTER_SETTINGS_LOAD_ERROR =
  'Could not load your settings. Saving is turned off until they load, so nothing here can overwrite your real settings.'

export const MASTER_SETTINGS_CONFLICT_MESSAGE =
  'Your settings were changed elsewhere, so we reloaded them. Please make your change again.'

export const MASTER_SETTINGS_SAVE_ERROR = 'Could not save your settings. Please try again.'

export interface LoadedMasterSettings {
  settings: Record<string, unknown>
  version: number
}

export interface MasterSettingsClient {
  get: () => Promise<unknown>
  update: (settings: unknown, expectedVersion?: number) => Promise<unknown>
}

export type MasterSettingsLoadResult =
  | { ok: true; document: LoadedMasterSettings }
  | { ok: false; message: string }

export type MasterSettingsSaveResult =
  | { ok: true; document: LoadedMasterSettings }
  | {
      ok: false
      saved: false
      conflict: boolean
      document: LoadedMasterSettings | null
      message: string
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export function readMasterSettingsDocument(response: unknown): LoadedMasterSettings | null {
  if (!isRecord(response) || !isRecord(response.settings) || !isVersion(response.version)) return null
  return { settings: response.settings, version: response.version }
}

export function canSaveMasterSettings(
  document: LoadedMasterSettings | null,
): document is LoadedMasterSettings {
  return document !== null
}

function httpStatus(error: unknown): number | null {
  if (!isRecord(error)) return null
  return typeof error.status === 'number' ? error.status : null
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export async function loadMasterSettings(
  api: Pick<MasterSettingsClient, 'get'>,
): Promise<MasterSettingsLoadResult> {
  try {
    const document = readMasterSettingsDocument(await api.get())
    if (!document) return { ok: false, message: MASTER_SETTINGS_LOAD_ERROR }
    return { ok: true, document }
  } catch {
    return { ok: false, message: MASTER_SETTINGS_LOAD_ERROR }
  }
}

export async function saveMasterSettings(
  document: LoadedMasterSettings | null,
  nextSettings: unknown,
  api: MasterSettingsClient,
): Promise<MasterSettingsSaveResult> {
  if (!canSaveMasterSettings(document)) {
    return {
      ok: false,
      saved: false,
      conflict: false,
      document: null,
      message: MASTER_SETTINGS_LOAD_ERROR,
    }
  }

  try {
    const response = await api.update(nextSettings, document.version)
    const echoed = readMasterSettingsDocument(response)
    return {
      ok: true,
      document: echoed ?? {
        settings: isRecord(nextSettings) ? nextSettings : document.settings,
        version: document.version + 1,
      },
    }
  } catch (error) {
    if (httpStatus(error) === 409) {
      const reloaded = await loadMasterSettings(api)
      return {
        ok: false,
        saved: false,
        conflict: true,
        document: reloaded.ok ? reloaded.document : null,
        message: MASTER_SETTINGS_CONFLICT_MESSAGE,
      }
    }
    return {
      ok: false,
      saved: false,
      conflict: false,
      document,
      message: errorMessage(error, MASTER_SETTINGS_SAVE_ERROR),
    }
  }
}
