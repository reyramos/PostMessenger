import * as Rx from "rxjs/Rx"
import "../PostMessage/post-messenger.js"

(window as any).Rx = Rx;
export function PostMessenger(dest?:any, opts?:any) {
  return new (window as any).PostMessenger(dest, opts)
}
