package com.safexpress.associate.app.security

import android.app.Activity
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest

object PlayIntegrityManager {

    fun check(activity: Activity, onFail: () -> Unit) {

        val integrityManager = IntegrityManagerFactory.create(activity)

        val request = IntegrityTokenRequest.builder()
            .setNonce("safexpress_integrity_nonce")
            .build()

        integrityManager.requestIntegrityToken(request)
            .addOnFailureListener { onFail() }
            .addOnSuccessListener { response ->
                if (response.token().isNullOrEmpty()) {
                    onFail()
                }
            }
    }
}
