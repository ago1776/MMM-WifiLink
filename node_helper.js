/* MMM-WifiLink node_helper — signal quality from `iw dev <iface> link`,
 * live throughput (down/up) from the /proc/net/dev delta. Linux only. */
const NodeHelper = require("node_helper");
const { exec } = require("child_process");
const fs = require("fs");

module.exports = NodeHelper.create({
	start() { this.iface = "wlan0"; this.last = null; },

	socketNotificationReceived(notification, payload) {
		if (notification === "WL_FETCH") {
			this.iface = (payload && payload.iface) || "wlan0";
			this.read();
		}
	},

	counters() {
		try {
			const line = fs.readFileSync("/proc/net/dev", "utf8")
				.split("\n").find((l) => l.trim().startsWith(this.iface + ":"));
			if (!line) return null;
			const parts = line.split(":")[1].trim().split(/\s+/);
			return { rx: parseInt(parts[0], 10), tx: parseInt(parts[8], 10), t: Date.now() };
		} catch (e) { return null; }
	},

	read() {
		const c = this.counters();
		let down = null, up = null;
		if (c && this.last) {
			const dt = (c.t - this.last.t) / 1000;
			if (dt > 0.3) {
				down = ((c.rx - this.last.rx) * 8) / dt / 1e6; // Mbit/s
				up = ((c.tx - this.last.tx) * 8) / dt / 1e6;
			}
		}
		if (c) this.last = c;

		exec(`iw dev ${this.iface} link`, { timeout: 4000 }, (err, stdout) => {
			if (err || !stdout || /Not connected/i.test(stdout)) {
				this.sendSocketNotification("WL_DATA", { connected: false });
				return;
			}
			const sigM = stdout.match(/signal:\s*(-?\d+)\s*dBm/);
			this.sendSocketNotification("WL_DATA", {
				connected: true,
				signal: sigM ? parseInt(sigM[1], 10) : null,
				down: down != null ? Math.max(0, down) : null,
				up: up != null ? Math.max(0, up) : null
			});
		});
	}
});
