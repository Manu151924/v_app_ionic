package com.safexpress.associate.app.security

import android.os.Build
import java.io.File

object RootChecker {

    private val paths = arrayOf(
        "/system/app/Superuser.apk",
        "/system/bin/su",
        "/system/xbin/su",
        "/sbin/su",
        "/data/local/su",
        "/su/bin/su"
    )

    fun isRooted(): Boolean {
        return hasTestKeys() || hasSuBinary() || hasMagisk()
    }

    private fun hasTestKeys() =
        Build.TAGS?.contains("test-keys") == true

    private fun hasSuBinary() =
        paths.any { File(it).exists() }

    private fun hasMagisk(): Boolean {
        return try {
            Runtime.getRuntime().exec("which su")
                .inputStream.bufferedReader().readLine() != null
        } catch (e: Exception) {
            false
        }
    }
}
