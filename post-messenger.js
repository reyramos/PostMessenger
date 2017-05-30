function _window() {
    // return the global native browser window object
    return window.opener || window.parent;
}
class PostMessenger {
    constructor(dest, options) {
        this.cbID = 0; // Create a unique callback ID to map requests to responses
        this.onmessage = {};
        this.dest = _window();
        this.validDomains = [];
        this.eventTypes = {
            OPENED: "InitialWindowRequest",
            CLOSED: "CloseWindowRequest",
            ONLOAD: "OnLoadWindowRequest"
        };
        if (dest.postMessage) {
            this.dest = dest;
        }
        else {
            this.dest = _window();
            options = dest;
        }
        let opts = Object.assign({}, {
            validDomains: [],
            onMessages: () => void {}
        }, options);
        this.validDomains = opts.validReceiveDomains;
        this.onMessages = opts.onMessages;
        this.send(this.eventTypes.OPENED);
        PostMessenger._windowRef.addEventListener('beforeunload', () => this.send(this.eventTypes.CLOSED), false);
        PostMessenger._windowRef.addEventListener('message', (e) => {
            let data = e.data;
            try {
                data = JSON.parse(e.data);
            }
            catch (e) {
            }
            if (this.isDomainAllowed(e.origin) && location.href.indexOf(e.origin) === -1) {
                let msg = data.msg;
                try {
                    msg = JSON.parse(data.msg);
                }
                catch (e) {
                }
                Object.assign(data, { msg: msg });
                this.onMessages(data, location.href, this.nativeWindow);
                if (typeof msg === "string") {
                    let sObj = {
                        promise: data.promise,
                    };
                    switch (msg) {
                        case this.eventTypes.OPENED:
                        case this.eventTypes.CLOSED:
                            // this.destroyPromis(data.promise);
                            break;
                        case 'ping':
                            Object.assign(sObj, { msg: 'pong' });
                            break;
                        default:
                            Object.assign(sObj, { msg: data.msg });
                            break;
                    }
                    this.send(sObj);
                }
                if (this.onmessage.hasOwnProperty(data.promise))
                    this.onmessage[data.promise].cb.next(data);
                this.destroyPromis(data.promise);
            }
            else if (data.promise)
                this.destroyPromis(data.promise);
        }, false);
        PostMessenger._windowRef.onunload = () => this.send(this.eventTypes.ONLOAD);
    }
    isDomainAllowed(domain) {
        let allowed = false;
        for (let i = 0, dom; (dom = this.validDomains[i]) && (i < this.validDomains.length); i++) {
            if (dom.indexOf(dom) !== -1) {
                allowed = true;
            }
        }
        return !this.validDomains.length ? true : allowed;
    }
    destroyPromis(eventType) {
        if (this.onmessage.hasOwnProperty(eventType)) {
            this.onmessage[eventType].cb.unsubscribe();
            delete this.onmessage[eventType];
        }
    }
    get nativeWindow() {
        return _window();
    }
    inIframe() {
        let topHost = document.referrer;
        let result = topHost ? location.href !== topHost : false;
        return result;
    }
    get CallBackIdentifier() {
        return this.cbID > 10000 ? this.cbID = 0 : this.cbID += 1;
    }
    send(message) {
        let eventType = (typeof (message.promise) === "undefined" ? this.CallBackIdentifier : message.promise);
        let msg = {
            promise: eventType,
            origin: location.href,
            msg: message,
            windowName: window.name
        };
        var subject = new Rx.Subject();
        this.onmessage[eventType] = {
            time: new Date(),
            cb: subject
        };
        if (!this.dest)
            return;
        this.dest.postMessage(JSON.stringify(msg), "*");
        return subject;
    }
    ;
}
PostMessenger._windowRef = window;
window.PostMessenger = PostMessenger;
