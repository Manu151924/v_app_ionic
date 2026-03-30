package com.safexpress.associate.app.network

import com.safexpress.associate.app.security.SslPinningClient
import okhttp3.OkHttpClient

object HttpClientProvider {
    val client: OkHttpClient by lazy {
        SslPinningClient.create()
    }
}
