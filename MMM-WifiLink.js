/* MagicMirror² Module: MMM-WifiLink
 * A clean, iOS-style Wi-Fi signal indicator: five bars, coloured by link quality.
 * Reads the real signal (dBm) from `iw` and updates in place (no flicker).
 *
 * By Andreas Göpfert — MIT Licensed.
 */
Module.register("MMM-WifiLink", {
	defaults: {
		iface: "wlan0",            // wireless interface to read
		updateInterval: 5 * 1000,  // poll interval (ms)
		showLabel: true,           // show the quality word under the bars
		barSize: "normal"          // "normal" | "small"
	},

	getStyles() { return ["MMM-WifiLink.css"]; },
	getTranslations() { return { en: "translations/en.json", de: "translations/de.json" }; },

	start() {
		this.wl = null;
		this.dom = null;
		this.tick();
		this.timer = setInterval(() => this.tick(), this.config.updateInterval);
	},

	tick() { this.sendSocketNotification("WL_FETCH", { iface: this.config.iface }); },

	socketNotificationReceived(n, p) {
		if (n === "WL_DATA") {
			this.wl = p;
			if (this.dom) this.render();   // in-place patch -> no re-render flicker
			else this.updateDom(0);        // first paint only
		}
	},

	// dBm -> number of lit bars (1..5)
	level(dbm) {
		if (dbm == null) return 0;
		if (dbm >= -55) return 5;
		if (dbm >= -62) return 4;
		if (dbm >= -70) return 3;
		if (dbm >= -78) return 2;
		return 1;
	},

	quality(lvl) {
		if (lvl >= 4) return { cls: "good", key: "WIFI_EXCELLENT" };
		if (lvl === 3) return { cls: "good", key: "WIFI_GOOD" };
		if (lvl === 2) return { cls: "mid", key: "WIFI_FAIR" };
		return { cls: "low", key: "WIFI_WEAK" };
	},

	getDom() {
		if (!this.dom) {
			this.dom = document.createElement("div");
			this.dom.className = "wl-wrap wl-" + this.config.barSize;
			this.dom.innerHTML =
				`<div class="wl-card"><div class="wl-bars">` +
				[1, 2, 3, 4, 5].map((i) => `<span class="wl-bar" data-i="${i}"></span>`).join("") +
				`</div>` + (this.config.showLabel ? `<div class="wl-word"></div>` : ``) + `</div>`;
		}
		this.render();
		return this.dom;
	},

	render() {
		if (!this.dom) return;
		const connected = this.wl && this.wl.connected;
		const lvl = connected ? this.level(this.wl.signal) : 0;
		const q = this.quality(lvl || 1);
		const card = this.dom.querySelector(".wl-card");
		if (card) card.className = "wl-card " + (connected ? "q-" + q.cls : "q-off");
		this.dom.querySelectorAll(".wl-bar").forEach((b) => {
			const i = parseInt(b.dataset.i, 10);
			b.classList.toggle("on", !!connected && lvl >= i);
		});
		const w = this.dom.querySelector(".wl-word");
		if (w) w.textContent = connected ? this.translate(q.key) : this.translate("WIFI_DISCONNECTED");
	}
});
