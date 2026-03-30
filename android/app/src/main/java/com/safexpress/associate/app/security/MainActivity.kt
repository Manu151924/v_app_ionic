package com.safexpress.associate.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.safexpress.associate.app.security.SecurityPlugin

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Register native security plugin
        registerPlugin(SecurityPlugin::class.java)
    }
}
