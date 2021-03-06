import browser, { Runtime } from "webextension-polyfill";
import { PorterMessageType, PorterClientMessage } from "./types";
import { deserializeError, PorterTimeoutError } from "./helpers";

export class PorterClient<ReqData = any, ResData = unknown> {
  private _port?: Runtime.Port;
  private reqId = 0;

  get port() {
    if (this._port) return this._port;

    throw new Error(
      "Not connected. Add `porter.connect()` at the top of your entry file"
    );
  }

  get connected() {
    return Boolean(this._port);
  }

  get name() {
    return this.port.name;
  }

  connect(name: string) {
    this._port = browser.runtime.connect({ name });
  }

  /**
   * Makes a request to background process and returns a response promise
   */
  async request(data: ReqData, requestTimeout = 60_000): Promise<ResData> {
    const reqId = this.reqId++;

    this.send({ type: PorterMessageType.Req, reqId, data });

    return new Promise((resolve, reject) => {
      let timeoutId: any;

      const listener = (msg: any) => {
        switch (true) {
          case msg?.reqId !== reqId:
            return;

          case msg?.type === PorterMessageType.Res:
            resolve(msg.data);
            break;

          case msg?.type === PorterMessageType.Err:
            reject(deserializeError(msg.data));
            break;
        }

        clearTimeout(timeoutId);
        this.port.onMessage.removeListener(listener);
      };

      this.port.onMessage.addListener(listener);

      if (requestTimeout !== Infinity) {
        timeoutId = setTimeout(() => {
          this.port.onMessage.removeListener(listener);
          reject(new PorterTimeoutError());
        }, requestTimeout);
      }
    });
  }

  /**
   * Allows to subscribe to notifications channel from background process
   */
  onMessage<OneWayData = unknown>(callback: (data: OneWayData) => void) {
    const listener = (msg: any) => {
      if (msg?.type === PorterMessageType.OneWay) {
        callback(msg.data);
      }
    };

    this.port.onMessage.addListener(listener);
    return () => this.port.onMessage.removeListener(listener);
  }

  onDisconnect(callback: () => void) {
    this.port.onDisconnect.addListener(callback);
    return this.port.onDisconnect.removeListener(callback);
  }

  destroy() {
    this.port.disconnect();
  }

  private send(msg: PorterClientMessage) {
    this.port.postMessage(msg);
  }
}
