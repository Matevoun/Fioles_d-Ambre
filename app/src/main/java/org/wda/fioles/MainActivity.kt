package org.wda.fioles

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream

// Fioles d'Ambre
// La page est lue dans les assets. Aucun fichier distant au démarrage.
// Verification de sécurité coupée : Sinon Android attend le réseau avant d'afficher.
// Dessin logiciel : Le OnePlus 13 laisse la WebView noire avec l'accélération matérielle.
class MainActivity : ComponentActivity() {
    private var webView: WebView? = null
    private var insetTop = 0
    private var insetBottom = 0
    private var lastFit = ""

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hideStatus()
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        val web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#161018"))
        web.layoutParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.useWideViewPort = true
        web.settings.loadWithOverviewMode = true
        web.settings.allowFileAccess = false
        web.settings.allowContentAccess = false
        web.settings.safeBrowsingEnabled = false
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            web.settings.isAlgorithmicDarkeningAllowed = false
        } else if (android.os.Build.VERSION.SDK_INT >= 29) {
            @Suppress("DEPRECATION")
            web.settings.forceDark = WebSettings.FORCE_DARK_OFF
        }
        web.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val url = request.url.toString()
                val found = loader.shouldInterceptRequest(request.url) ?: return null
                return withMime(found, url)
            }

            @Deprecated("Ancienne WebView")
            override fun shouldInterceptRequest(view: WebView, url: String): WebResourceResponse? {
                val found = loader.shouldInterceptRequest(Uri.parse(url)) ?: return null
                return withMime(found, url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") return false
                startActivity(Intent(Intent.ACTION_VIEW, url))
                return true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                view?.let { fit(it) }
            }
        }
        ViewCompat.setOnApplyWindowInsetsListener(web) { _, insets ->
            val cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout())
            val nav = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
            insetTop = cutout.top
            insetBottom = maxOf(nav.bottom, cutout.bottom)
            lastFit = ""
            fit(web)
            insets
        }
        web.viewTreeObserver.addOnGlobalLayoutListener { fit(web) }
        setContentView(web)
        webView = web
        web.post { web.loadUrl("https://appassets.androidplatform.net/assets/index.html") }
    }

    private fun hideStatus() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.statusBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideStatus()
    }

    private fun fit(web: WebView) {
        val d = resources.displayMetrics.density
        if (web.height < 200 || web.width < 200) return
        val top = (insetTop / d).toInt()
        val bottom = (insetBottom / d).toInt()
        val key = "$top,$bottom,${web.width},${web.height}"
        if (key == lastFit) return
        lastFit = key
        web.evaluateJavascript(
            """
            (function () {
              var s = document.getElementById('android-fit');
              if (!s) {
                s = document.createElement('style');
                s.id = 'android-fit';
                document.head.appendChild(s);
              }
              s.textContent = '.stage{position:fixed !important;left:0 !important;right:0 !important;top:${top}px !important;bottom:${bottom}px !important;height:auto !important;min-height:0 !important;width:auto !important;}';
              requestAnimationFrame(function () {
                requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
              });
            })();
            """.trimIndent(),
            null
        )
    }

    private fun withMime(found: WebResourceResponse, url: String): WebResourceResponse {
        val headers = HashMap(found.responseHeaders ?: emptyMap())
        headers["Access-Control-Allow-Origin"] = "*"
        val path = url.substringBefore('?').substringBefore('#')
        val mime = when {
            path.endsWith(".js") -> "text/javascript"
            path.endsWith(".css") -> "text/css"
            path.endsWith(".svg") -> "image/svg+xml"
            path.endsWith(".webp") -> "image/webp"
            path.endsWith(".png") -> "image/png"
            path.endsWith(".html") -> "text/html"
            path.endsWith(".woff2") -> "font/woff2"
            else -> found.mimeType ?: "application/octet-stream"
        }
        val encoding = if (mime.startsWith("text/") || mime.startsWith("image/svg")) "utf-8" else null
        val bytes = found.data?.use { it.readBytes() } ?: ByteArray(0)
        return WebResourceResponse(mime, encoding, 200, "OK", headers, ByteArrayInputStream(bytes))
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}