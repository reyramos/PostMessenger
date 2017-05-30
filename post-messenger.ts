declare let Rx: any;

function _window(): any {
  // return the global native browser window object
  return window.opener || window.parent;
}

interface _defaultOptions {
  validReceiveDomains?: Array<string>;
  onMessages?: (data: any, source: any, origin: string) => void;
}


class PostMessenger {
  
  
  private cbID: number = 0; // Create a unique callback ID to map requests to responses
  private onmessage: any = {};
  private dest: any = _window();
  
  private validDomains: Array<string> = [];
  private onMessages: (data: any, source: any, origin: any) => void;
  
  public eventTypes = {
    OPENED: "InitialWindowRequest",
    CLOSED: "CloseWindowRequest",
    ONLOAD: "OnLoadWindowRequest"
  };
  
  
  static _windowRef: any = window;
  
  
  private isDomainAllowed(domain): boolean {
    let allowed = false;
    for (let i = 0, dom; (dom = this.validDomains[i]) && (i < this.validDomains.length); i++) {
      if (dom.indexOf(dom) !== -1) {
        allowed = true;
      }
    }
    return !this.validDomains.length ? true : allowed;
  }
  
  constructor(dest: IWindowObjectReference | _defaultOptions, options?: _defaultOptions) {
    
    if ((dest as any).postMessage) {
      this.dest = dest;
    } else {
      this.dest = _window();
      options = dest;
    }
    
    let opts: _defaultOptions = Object.assign({}, {
      validDomains: [],
      onMessages  : () => void{}
    }, options);
    
    
    this.validDomains = opts.validReceiveDomains;
    this.onMessages = opts.onMessages;
    
    this.send(this.eventTypes.OPENED);
    
    PostMessenger._windowRef.addEventListener('beforeunload', () => this.send(this.eventTypes.CLOSED), false);
    PostMessenger._windowRef.addEventListener('message', (e) => {
      let data = e.data;
      try {
        data = JSON.parse(e.data);
      } catch (e) {
      }
      
      if (this.isDomainAllowed(e.origin) && location.href.indexOf(e.origin) === -1) {
        let msg = data.msg;
        try {
          msg = JSON.parse(data.msg);
        } catch (e) {
        }
        Object.assign(data, {msg: msg});
        
        
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
              Object.assign(sObj, {msg: 'pong'});
              break;
            default:
              Object.assign(sObj, {msg: data.msg});
              
              break;
          }
          this.send(sObj);
        }
        
        if (this.onmessage.hasOwnProperty(data.promise)) this.onmessage[data.promise].cb.next(data);
        this.destroyPromis(data.promise);
        
      } else if (data.promise) this.destroyPromis(data.promise)
    }, false);
    PostMessenger._windowRef.onunload = () => this.send(this.eventTypes.ONLOAD);
  }
  
  private destroyPromis(eventType) {
    if (this.onmessage.hasOwnProperty(eventType)) {
      this.onmessage[eventType].cb.unsubscribe();
      delete this.onmessage[eventType];
    }
  }
  
  private get nativeWindow(): any {
    return _window();
  }
  
  public inIframe() {
    let topHost = document.referrer;
    let result = topHost ? location.href !== topHost : false;
    return result;
  }
  
  get CallBackIdentifier(): number {
    return this.cbID > 10000 ? this.cbID = 0 : this.cbID += 1;
  }
  
  public send(message: string | any) {
    
    let eventType = (typeof(message.promise) === "undefined" ? this.CallBackIdentifier : message.promise);
    
    let msg: any = {
      promise   : eventType,
      origin    : location.href,
      msg       : message,
      windowName: window.name
    };
    
    var subject = new Rx.Subject();
    
    this.onmessage[eventType] = {
      time: new Date(),
      cb  : subject
    };
    
    if (!this.dest)return;
    this.dest.postMessage(JSON.stringify(msg), "*");
    
    return subject;
    
  };
  
}


interface IWindowObjectReference {
  postMessage(message: string, targetOrigin: any, transfer?: any): void;
}


(window as any).PostMessenger = PostMessenger;
