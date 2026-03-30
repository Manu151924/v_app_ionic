package com.safexpress.associate.app.security

import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

object SslPinningClient {

    private const val HOST = "dgapi-uat-nonprod.safexpress.com"

    private val certificatePinner = CertificatePinner.Builder()
        .add(HOST, "sha256/5ZsSfafmvyG7THiBpQfONNERSOKrghfG8RRma9knik8=")
        .add(HOST, "sha256/Wec45nQiFwKvHtuHxSAMGkt19k+uPSw9JlEkxhvYPHk=")
        .build()

    fun create(): OkHttpClient {
        return OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
}
