package com.safexpress.associate.app.security

import android.content.pm.PackageManager
import android.os.Debug
import android.provider.Settings
import com.getcapacitor.*
import ee.forgr.capacitor.isroot.IsRoot

@CapacitorPlugin(name = "Security")
class SecurityPlugin : Plugin() {

    @PluginMethod
    fun performChecks(call: PluginCall) {

        // ROOT CHECK (custom + Capgo)
        if (RootChecker.isRooted() || IsRoot.isRoot()) {
            call.resolve(block("ROOTED_DEVICE"))
            return
        }

        // DEVELOPER OPTIONS
        val devEnabled = try {
    Settings.Global.getInt(
        context.contentResolver,
        Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0
    ) == 1
} catch (e: Exception) {
    false
}

val adbEnabled = try {
    Settings.Global.getInt(
        context.contentResolver,
        Settings.Global.ADB_ENABLED, 0
    ) == 1
} catch (e: Exception) {
    false
}

if (devEnabled || adbEnabled) {
    call.resolve(block("DEVELOPER_MODE"))
    return
}


        // DEBUGGER DETECTION
        if (Debug.isDebuggerConnected()) {
            call.resolve(block("DEBUGGER_ATTACHED"))
            return
        }

        // EMULATOR DETECTION
        if (android.os.Build.FINGERPRINT.contains("generic")) {
            call.resolve(block("EMULATOR"))
            return
        }

        // APK SIGNATURE CHECK
        if (!isSignatureValid()) {
            call.resolve(block("TAMPERED_APP"))
            return
        }

        call.resolve(ok())
    }

    private fun block(reason: String): JSObject {
        val res = JSObject()
        res.put("status", "BLOCKED")
        res.put("reason", reason)
        return res
    }

    private fun ok(): JSObject {
        val res = JSObject()
        res.put("status", "OK")
        return res
    }

    private fun isSignatureValid(): Boolean {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                PackageManager.GET_SIGNING_CERTIFICATES
            )
            packageInfo.signingInfo != null
        } catch (e: Exception) {
            false
        }
    }
}
