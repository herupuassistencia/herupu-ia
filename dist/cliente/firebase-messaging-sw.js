(()=>{var Pe=()=>{};var je=function(e){let t=[],n=0;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=i&63|128):(i&64512)===55296&&r+1<e.length&&(e.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(e.charCodeAt(++r)&1023),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=i&63|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=i&63|128)}return t},Wt=function(e){let t=[],n=0,r=0;for(;n<e.length;){let i=e[n++];if(i<128)t[r++]=String.fromCharCode(i);else if(i>191&&i<224){let o=e[n++];t[r++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){let o=e[n++],s=e[n++],c=e[n++],u=((i&7)<<18|(o&63)<<12|(s&63)<<6|c&63)-65536;t[r++]=String.fromCharCode(55296+(u>>10)),t[r++]=String.fromCharCode(56320+(u&1023))}else{let o=e[n++],s=e[n++];t[r++]=String.fromCharCode((i&15)<<12|(o&63)<<6|s&63)}}return t.join("")},He={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();let n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<e.length;i+=3){let o=e[i],s=i+1<e.length,c=s?e[i+1]:0,u=i+2<e.length,a=u?e[i+2]:0,O=o>>2,R=(o&3)<<4|c>>4,$=(c&15)<<2|a>>6,j=a&63;u||(j=64,s||($=64)),r.push(n[O],n[R],n[$],n[j])}return r.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(je(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):Wt(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();let n=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<e.length;){let o=n[e.charAt(i++)],c=i<e.length?n[e.charAt(i)]:0;++i;let a=i<e.length?n[e.charAt(i)]:64;++i;let R=i<e.length?n[e.charAt(i)]:64;if(++i,o==null||c==null||a==null||R==null)throw new Z;let $=o<<2|c>>4;if(r.push($),a!==64){let j=c<<4&240|a>>2;if(r.push(j),R!==64){let Kt=a<<6&192|R;r.push(Kt)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}},Z=class extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}},zt=function(e){let t=je(e);return He.encodeByteArray(t,!0)},ee=function(e){return zt(e).replace(/\./g,"")},Ue=function(e){try{return He.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};function qt(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}var Gt=()=>qt().__FIREBASE_DEFAULTS__,Jt=()=>{if(typeof process>"u"||typeof process.env>"u")return;let e=process.env.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},Qt=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}let t=e&&Ue(e[1]);return t&&JSON.parse(t)},Yt=()=>{try{return Pe()||Gt()||Jt()||Qt()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}};var te=()=>Yt()?.config;var H=class{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,n)=>{this.resolve=t,this.reject=n})}wrapCallback(t){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(n):t(n,r))}}};function U(){try{return typeof indexedDB=="object"}catch{return!1}}function V(){return new Promise((e,t)=>{try{let n=!0,r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),e(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{t(i.error?.message||"")}}catch(n){t(n)}})}var Xt="FirebaseError",b=class e extends Error{constructor(t,n,r){super(n),this.code=t,this.customData=r,this.name=Xt,Object.setPrototypeOf(this,e.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,m.prototype.create)}},m=class{constructor(t,n,r){this.service=t,this.serviceName=n,this.errors=r}create(t,...n){let r=n[0]||{},i=`${this.service}/${t}`,o=this.errors[t],s=o?Zt(o,r):"Error",c=`${this.serviceName}: ${s} (${i}).`;return new b(i,c,r)}};function Zt(e,t){try{let n=0,r="";for(;n<e.length;){let i=e.indexOf("{$",n);if(i===-1){r+=e.substring(n);break}let o=e.indexOf("}",i+2);if(o===-1){r+=e.substring(n);break}let s=e.substring(i+2,o),c=t[s];r+=e.substring(n,i)+(c!=null?String(c):`<${s}?>`),n=o+1}return r}catch{return e}}function K(e,t){if(e===t)return!0;let n=Object.keys(e),r=Object.keys(t);for(let i of n){if(!r.includes(i))return!1;let o=e[i],s=t[i];if($e(o)&&$e(s)){if(!K(o,s))return!1}else if(o!==s)return!1}for(let i of r)if(!n.includes(i))return!1;return!0}function $e(e){return e!==null&&typeof e=="object"}var ao=14400*1e3;function ne(e){return e&&e._delegate?e._delegate:e}var l=class{constructor(t,n,r){this.name=t,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}};var I="[DEFAULT]";var re=class{constructor(t,n){this.name=t,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){let n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){let r=new H;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{let i=this.getOrInitializeService({instanceIdentifier:n});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(t){let n=this.normalizeInstanceIdentifier(t?.identifier),r=t?.optional??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(tn(t))try{this.getOrInitializeService({instanceIdentifier:I})}catch{}for(let[n,r]of this.instancesDeferred.entries()){let i=this.normalizeInstanceIdentifier(n);try{let o=this.getOrInitializeService({instanceIdentifier:i});r.resolve(o)}catch{}}}}clearInstance(t=I){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){let t=Array.from(this.instances.values());await Promise.all([...t.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...t.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=I){return this.instances.has(t)}getOptions(t=I){return this.instancesOptions.get(t)||{}}initialize(t={}){let{options:n={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);let i=this.getOrInitializeService({instanceIdentifier:r,options:n});for(let[o,s]of this.instancesDeferred.entries()){let c=this.normalizeInstanceIdentifier(o);r===c&&s.resolve(i)}return i}onInit(t,n){let r=this.normalizeInstanceIdentifier(n),i=this.onInitCallbacks.get(r)??new Set;i.add(t),this.onInitCallbacks.set(r,i);let o=this.instances.get(r);return o&&t(o,r),()=>{i.delete(t)}}invokeOnInitCallbacks(t,n){let r=this.onInitCallbacks.get(n);if(r)for(let i of r)try{i(t,n)}catch{}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:en(t),options:n}),this.instances.set(t,r),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=I){return this.component?this.component.multipleInstances?t:I:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}};function en(e){return e===I?void 0:e}function tn(e){return e.instantiationMode==="EAGER"}var W=class{constructor(t){this.name=t,this.providers=new Map}addComponent(t){let n=this.getProvider(t.name);if(n.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);n.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);let n=new re(t,this);return this.providers.set(t,n),n}getProviders(){return Array.from(this.providers.values())}};var nn=[],f;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(f||(f={}));var rn={debug:f.DEBUG,verbose:f.VERBOSE,info:f.INFO,warn:f.WARN,error:f.ERROR,silent:f.SILENT},on=f.INFO,sn={[f.DEBUG]:"log",[f.VERBOSE]:"log",[f.INFO]:"info",[f.WARN]:"warn",[f.ERROR]:"error"},an=(e,t,...n)=>{if(t<e.logLevel)return;let r=new Date().toISOString(),i=sn[t];if(i)console[i](`[${r}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)},z=class{constructor(t){this.name=t,this._logLevel=on,this._logHandler=an,this._userLogHandler=null,nn.push(this)}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in f))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?rn[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,f.DEBUG,...t),this._logHandler(this,f.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,f.VERBOSE,...t),this._logHandler(this,f.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,f.INFO,...t),this._logHandler(this,f.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,f.WARN,...t),this._logHandler(this,f.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,f.ERROR,...t),this._logHandler(this,f.ERROR,...t)}};var cn=(e,t)=>t.some(n=>e instanceof n),Ve,Ke;function un(){return Ve||(Ve=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function fn(){return Ke||(Ke=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}var We=new WeakMap,oe=new WeakMap,ze=new WeakMap,ie=new WeakMap,ae=new WeakMap;function dn(e){let t=new Promise((n,r)=>{let i=()=>{e.removeEventListener("success",o),e.removeEventListener("error",s)},o=()=>{n(h(e.result)),i()},s=()=>{r(e.error),i()};e.addEventListener("success",o),e.addEventListener("error",s)});return t.then(n=>{n instanceof IDBCursor&&We.set(n,e)}).catch(()=>{}),ae.set(t,e),t}function ln(e){if(oe.has(e))return;let t=new Promise((n,r)=>{let i=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",s),e.removeEventListener("abort",s)},o=()=>{n(),i()},s=()=>{r(e.error||new DOMException("AbortError","AbortError")),i()};e.addEventListener("complete",o),e.addEventListener("error",s),e.addEventListener("abort",s)});oe.set(e,t)}var se={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return oe.get(e);if(t==="objectStoreNames")return e.objectStoreNames||ze.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return h(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function qe(e){se=e(se)}function hn(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){let r=e.call(q(this),t,...n);return ze.set(r,t.sort?t.sort():[t]),h(r)}:fn().includes(e)?function(...t){return e.apply(q(this),t),h(We.get(this))}:function(...t){return h(e.apply(q(this),t))}}function pn(e){return typeof e=="function"?hn(e):(e instanceof IDBTransaction&&ln(e),cn(e,un())?new Proxy(e,se):e)}function h(e){if(e instanceof IDBRequest)return dn(e);if(ie.has(e))return ie.get(e);let t=pn(e);return t!==e&&(ie.set(e,t),ae.set(t,e)),t}var q=e=>ae.get(e);function v(e,t,{blocked:n,upgrade:r,blocking:i,terminated:o}={}){let s=indexedDB.open(e,t),c=h(s);return r&&s.addEventListener("upgradeneeded",u=>{r(h(s.result),u.oldVersion,u.newVersion,h(s.transaction),u)}),n&&s.addEventListener("blocked",u=>n(u.oldVersion,u.newVersion,u)),c.then(u=>{o&&u.addEventListener("close",()=>o()),i&&u.addEventListener("versionchange",a=>i(a.oldVersion,a.newVersion,a))}).catch(()=>{}),c}function N(e,{blocked:t}={}){let n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",r=>t(r.oldVersion,r)),h(n).then(()=>{})}var gn=["get","getKey","getAll","getAllKeys","count"],bn=["put","add","delete","clear"],ce=new Map;function Ge(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(ce.get(t))return ce.get(t);let n=t.replace(/FromIndex$/,""),r=t!==n,i=bn.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(i||gn.includes(n)))return;let o=async function(s,...c){let u=this.transaction(s,i?"readwrite":"readonly"),a=u.store;return r&&(a=a.index(c.shift())),(await Promise.all([a[n](...c),i&&u.done]))[0]};return ce.set(t,o),o}qe(e=>({...e,get:(t,n,r)=>Ge(t,n)||e.get(t,n,r),has:(t,n)=>!!Ge(t,n)||e.has(t,n)}));var fe=class{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(mn(n)){let r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}};function mn(e){return e.getComponent()?.type==="VERSION"}var de="@firebase/app",Je="0.16.7";var y=new z("@firebase/app"),wn="@firebase/app-compat",yn="@firebase/analytics-compat",_n="@firebase/analytics",En="@firebase/app-check-compat",Sn="@firebase/app-check",In="@firebase/auth",vn="@firebase/auth-compat",Tn="@firebase/crashlytics",An="@firebase/database",Dn="@firebase/data-connect",Cn="@firebase/database-compat",kn="@firebase/functions",On="@firebase/functions-compat",Rn="@firebase/installations",Nn="@firebase/installations-compat",Mn="@firebase/messaging",xn="@firebase/messaging-compat",Bn="@firebase/performance",Fn="@firebase/performance-compat",Ln="@firebase/remote-config",Pn="@firebase/remote-config-compat",$n="@firebase/storage",jn="@firebase/storage-compat",Hn="@firebase/firestore",Un="@firebase/ai",Vn="@firebase/firestore-compat",Kn="firebase";var le="[DEFAULT]",Wn={[de]:"fire-core",[wn]:"fire-core-compat",[_n]:"fire-analytics",[yn]:"fire-analytics-compat",[Sn]:"fire-app-check",[En]:"fire-app-check-compat",[In]:"fire-auth",[vn]:"fire-auth-compat",[Tn]:"fire-cls",[An]:"fire-rtdb",[Dn]:"fire-data-connect",[Cn]:"fire-rtdb-compat",[kn]:"fire-fn",[On]:"fire-fn-compat",[Rn]:"fire-iid",[Nn]:"fire-iid-compat",[Mn]:"fire-fcm",[xn]:"fire-fcm-compat",[Bn]:"fire-perf",[Fn]:"fire-perf-compat",[Ln]:"fire-rc",[Pn]:"fire-rc-compat",[$n]:"fire-gcs",[jn]:"fire-gcs-compat",[Hn]:"fire-fst",[Vn]:"fire-fst-compat",[Un]:"fire-vertex","fire-js":"fire-js",[Kn]:"fire-js-all"};var G=new Map,zn=new Map,he=new Map;function Qe(e,t){try{e.container.addComponent(t)}catch(n){y.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function S(e){let t=e.name;if(he.has(t))return y.debug(`There were multiple attempts to register component ${t}.`),!1;he.set(t,e);for(let n of G.values())Qe(n,e);for(let n of zn.values())Qe(n,e);return!0}function x(e,t){let n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}var qn={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},w=new m("app","Firebase",qn);var pe=class{constructor(t,n,r){this._isDeleted=!1,this._options={...t},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new l("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw w.create("app-deleted",{appName:this._name})}};function me(e,t={}){let n=e;typeof t!="object"&&(t={name:t});let r={name:le,automaticDataCollectionEnabled:!0,...t},i=r.name;if(typeof i!="string"||!i)throw w.create("bad-app-name",{appName:String(i)});if(n||(n=te()),!n)throw w.create("no-options");let o=G.get(i);if(o)if(K(n,o.options)){if(K(r,o.config))return o;throw w.create("duplicate-app",{appName:i,mismatchedParam:"config",oldValue:JSON.stringify(o.config),newValue:JSON.stringify(r)})}else throw w.create("duplicate-app",{appName:i,mismatchedParam:"options",oldValue:JSON.stringify(o.options),newValue:JSON.stringify(n)});let s=new W(i);for(let u of he.values())s.addComponent(u);let c=new pe(n,r,s);return G.set(i,c),c}function we(e=le){let t=G.get(e);if(!t&&e===le&&te())return me();if(!t)throw w.create("no-app",{appName:e});return t}function E(e,t,n){let r=Wn[e]??e;n&&(r+=`-${n}`);let i=r.match(/\s|\//),o=t.match(/\s|\//);if(i||o){let s=[`Unable to register library "${r}" with version "${t}":`];i&&s.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&o&&s.push("and"),o&&s.push(`version name "${t}" contains illegal characters (whitespace or "/")`),y.warn(s.join(" "));return}S(new l(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}var Gn="firebase-heartbeat-database",Jn=1,M="firebase-heartbeat-store",ue=null;function et(){return ue||(ue=v(Gn,Jn,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(M)}catch(n){console.warn(n)}}}}).catch(e=>{throw w.create("idb-open",{originalErrorMessage:e.message})})),ue}async function Qn(e){try{let n=(await et()).transaction(M),r=await n.objectStore(M).get(tt(e));return await n.done,r}catch(t){if(t instanceof b)y.warn(t.message);else{let n=w.create("idb-get",{originalErrorMessage:t?.message});y.warn(n.message)}}}async function Ye(e,t){try{let r=(await et()).transaction(M,"readwrite");await r.objectStore(M).put(t,tt(e)),await r.done}catch(n){if(n instanceof b)y.warn(n.message);else{let r=w.create("idb-set",{originalErrorMessage:n?.message});y.warn(r.message)}}}function tt(e){return`${e.name}!${e.options.appId}`}var Yn=1024,Xn=30,ge=class{constructor(t){this.container=t,this._heartbeatsCache=null;let n=this.container.getProvider("app").getImmediate();this._storage=new be(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){try{let n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=Xe();if(this._heartbeatsCache?.heartbeats==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(i=>i.date===r))return;if(this._heartbeatsCache.heartbeats.push({date:r,agent:n}),this._heartbeatsCache.heartbeats.length>Xn){let i=er(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(t){y.warn(t)}}async getHeartbeatsHeader(){try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null||this._heartbeatsCache.heartbeats.length===0)return"";let t=Xe(),{heartbeatsToSend:n,unsentEntries:r}=Zn(this._heartbeatsCache.heartbeats),i=ee(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return y.warn(t),""}}};function Xe(){return new Date().toISOString().substring(0,10)}function Zn(e,t=Yn){let n=[],r=e.slice();for(let i of e){let o=n.find(s=>s.agent===i.agent);if(o){if(o.dates.push(i.date),Ze(n)>t){o.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),Ze(n)>t){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}var be=class{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return U()?V().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){let n=await Qn(this.app);return n?.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){let r=await this.read();return Ye(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){let r=await this.read();return Ye(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}};function Ze(e){return ee(JSON.stringify({version:2,heartbeats:e})).length}function er(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let r=1;r<e.length;r++)e[r].date<n&&(n=e[r].date,t=r);return t}function tr(e){S(new l("platform-logger",t=>new fe(t),"PRIVATE")),S(new l("heartbeat",t=>new ge(t),"PRIVATE")),E(de,Je,e),E(de,Je,"esm2020"),E("fire-js","")}tr("");var nr="firebase",rr="13.4.0";E(nr,rr,"app");var it="@firebase/installations",Se="0.6.24";var ot=1e4,st=`w:${Se}`,at="FIS_v2",ir="https://firebaseinstallations.googleapis.com/v1",or=3600*1e3,sr="installations",ar="Installations";var cr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},A=new m(sr,ar,cr);function ct(e){return e instanceof b&&e.code.includes("request-failed")}function ut({projectId:e}){return`${ir}/projects/${e}/installations`}function ft(e){return{token:e.token,requestStatus:2,expiresIn:fr(e.expiresIn),creationTime:Date.now()}}async function dt(e,t){let r=(await t.json()).error;return A.create("request-failed",{requestName:e,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function lt({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function ur(e,{refreshToken:t}){let n=lt(e);return n.append("Authorization",dr(t)),n}async function ht(e){let t=await e();return t.status>=500&&t.status<600?e():t}function fr(e){return Number(e.replace("s","000"))}function dr(e){return`${at} ${e}`}async function lr({appConfig:e,heartbeatServiceProvider:t},{fid:n}){let r=ut(e),i=lt(e),o=t.getImmediate({optional:!0});if(o){let a=await o.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}let s={fid:n,authVersion:at,appId:e.appId,sdkVersion:st},c={method:"POST",headers:i,body:JSON.stringify(s)},u=await ht(()=>fetch(r,c));if(u.ok){let a=await u.json();return{fid:a.fid||n,registrationStatus:2,refreshToken:a.refreshToken,authToken:ft(a.authToken)}}else throw await dt("Create Installation",u)}function pt(e){return new Promise(t=>{setTimeout(t,e)})}function hr(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}var pr=/^[cdef][\w-]{21}$/,Ee="";function gr(){try{let e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;let n=br(e);return pr.test(n)?n:Ee}catch{return Ee}}function br(e){return hr(e).substr(0,22)}function Q(e){return`${e.appName}!${e.appId}`}var gt=new Map;function bt(e,t){let n=Q(e);mt(n,t),mr(n,t)}function mt(e,t){let n=gt.get(e);if(n)for(let r of n)r(t)}function mr(e,t){let n=wr();n&&n.postMessage({key:e,fid:t}),yr()}var T=null;function wr(){return!T&&"BroadcastChannel"in self&&(T=new BroadcastChannel("[Firebase] FID Change"),T.onmessage=e=>{mt(e.data.key,e.data.fid)}),T}function yr(){gt.size===0&&T&&(T.close(),T=null)}var _r="firebase-installations-database",Er=1,D="firebase-installations-store",ye=null;function Ie(){return ye||(ye=v(_r,Er,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(D)}}})),ye}async function J(e,t){let n=Q(e),i=(await Ie()).transaction(D,"readwrite"),o=i.objectStore(D),s=await o.get(n);return await o.put(t,n),await i.done,(!s||s.fid!==t.fid)&&bt(e,t.fid),t}async function wt(e){let t=Q(e),r=(await Ie()).transaction(D,"readwrite");await r.objectStore(D).delete(t),await r.done}async function Y(e,t){let n=Q(e),i=(await Ie()).transaction(D,"readwrite"),o=i.objectStore(D),s=await o.get(n),c=t(s);return c===void 0?await o.delete(n):await o.put(c,n),await i.done,c&&(!s||s.fid!==c.fid)&&bt(e,c.fid),c}async function ve(e){let t,n=await Y(e.appConfig,r=>{let i=Sr(r),o=Ir(e,i);return t=o.registrationPromise,o.installationEntry});return n.fid===Ee?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Sr(e){let t=e||{fid:gr(),registrationStatus:0};return yt(t)}function Ir(e,t){if(t.registrationStatus===0){if(!navigator.onLine){let i=Promise.reject(A.create("app-offline"));return{installationEntry:t,registrationPromise:i}}let n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},r=vr(e,n);return{installationEntry:n,registrationPromise:r}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Tr(e)}:{installationEntry:t}}async function vr(e,t){try{let n=await lr(e,t);return J(e.appConfig,n)}catch(n){throw ct(n)&&n.customData.serverCode===409?await wt(e.appConfig):await J(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Tr(e){let t=await nt(e.appConfig);for(;t.registrationStatus===1;)await pt(100),t=await nt(e.appConfig);if(t.registrationStatus===0){let{installationEntry:n,registrationPromise:r}=await ve(e);return r||n}return t}function nt(e){return Y(e,t=>{if(!t)throw A.create("installation-not-found");return yt(t)})}function yt(e){return Ar(e)?{fid:e.fid,registrationStatus:0}:e}function Ar(e){return e.registrationStatus===1&&e.registrationTime+ot<Date.now()}async function Dr({appConfig:e,heartbeatServiceProvider:t},n){let r=Cr(e,n),i=ur(e,n),o=t.getImmediate({optional:!0});if(o){let a=await o.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}let s={installation:{sdkVersion:st,appId:e.appId}},c={method:"POST",headers:i,body:JSON.stringify(s)},u=await ht(()=>fetch(r,c));if(u.ok){let a=await u.json();return ft(a)}else throw await dt("Generate Auth Token",u)}function Cr(e,{fid:t}){return`${ut(e)}/${t}/authTokens:generate`}async function Te(e,t=!1){let n,r=await Y(e.appConfig,o=>{if(!_t(o))throw A.create("not-registered");let s=o.authToken;if(!t&&Rr(s))return o;if(s.requestStatus===1)return n=kr(e,t),o;{if(!navigator.onLine)throw A.create("app-offline");let c=Mr(o);return n=Or(e,c),c}});return n?await n:r.authToken}async function kr(e,t){let n=await rt(e.appConfig);for(;n.authToken.requestStatus===1;)await pt(100),n=await rt(e.appConfig);let r=n.authToken;return r.requestStatus===0?Te(e,t):r}function rt(e){return Y(e,t=>{if(!_t(t))throw A.create("not-registered");let n=t.authToken;return xr(n)?{...t,authToken:{requestStatus:0}}:t})}async function Or(e,t){try{let n=await Dr(e,t),r={...t,authToken:n};return await J(e.appConfig,r),n}catch(n){if(ct(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await wt(e.appConfig);else{let r={...t,authToken:{requestStatus:0}};await J(e.appConfig,r)}throw n}}function _t(e){return e!==void 0&&e.registrationStatus===2}function Rr(e){return e.requestStatus===2&&!Nr(e)}function Nr(e){let t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+or}function Mr(e){let t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function xr(e){return e.requestStatus===1&&e.requestTime+ot<Date.now()}async function Br(e){let t=e,{installationEntry:n,registrationPromise:r}=await ve(t);return r?r.catch(console.error):Te(t).catch(console.error),n.fid}async function Fr(e,t=!1){let n=e;return await Lr(n),(await Te(n,t)).token}async function Lr(e){let{registrationPromise:t}=await ve(e);t&&await t}function Pr(e){if(!e||!e.options)throw _e("App Configuration");if(!e.name)throw _e("App Name");let t=["projectId","apiKey","appId"];for(let n of t)if(!e.options[n])throw _e(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function _e(e){return A.create("missing-app-config-values",{valueName:e})}var Et="installations",$r="installations-internal",jr=e=>{let t=e.getProvider("app").getImmediate(),n=Pr(t),r=x(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},Hr=e=>{let t=e.getProvider("app").getImmediate(),n=x(t,Et).getImmediate();return{getId:()=>Br(n),getToken:i=>Fr(n,i)}};function Ur(){S(new l(Et,jr,"PUBLIC")),S(new l($r,Hr,"PRIVATE"))}Ur();E(it,Se);E(it,Se,"esm2020");var ke="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Vr="https://fcmregistrations.googleapis.com/v1",xt="FCM_MSG",Kr="google.c.a.c_id",St=1e3,It=3,Bt=864e5,Wr=5e3,zr=1249,qr=3,Gr=1,X;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(X||(X={}));var F;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked",e.FID_REGISTERED="fid-registered"})(F||(F={}));function p(e){let t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Ft(e){let t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),r=atob(n),i=new Uint8Array(r.length);for(let o=0;o<r.length;++o)i[o]=r.charCodeAt(o);return i}var Ae="fcm_token_details_db",Jr=5,vt="fcm_token_object_Store";async function Qr(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(o=>o.name).includes(Ae))return null;let t=null;return(await v(Ae,Jr,{upgrade:async(r,i,o,s)=>{if(i<2||!r.objectStoreNames.contains(vt))return;let c=s.objectStore(vt),u=await c.index("fcmSenderId").get(e);if(await c.clear(),!!u){if(i===2){let a=u;if(!a.auth||!a.p256dh||!a.endpoint)return;t={token:a.fcmToken,createTime:a.createTime??Date.now(),subscriptionOptions:{auth:a.auth,p256dh:a.p256dh,endpoint:a.endpoint,swScope:a.swScope,vapidKey:typeof a.vapidKey=="string"?a.vapidKey:p(a.vapidKey)}}}else if(i===3){let a=u;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:p(a.auth),p256dh:p(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:p(a.vapidKey)}}}else if(i===4){let a=u;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:p(a.auth),p256dh:p(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:p(a.vapidKey)}}}}}})).close(),await N(Ae),await N("fcm_vapid_details_db"),await N("undefined"),Yr(t)?t:null}function Yr(e){if(!e||!e.subscriptionOptions)return!1;let{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}var Xr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","fid-registration-failed":"A problem occurred while creating an FCM registration via FID: {$errorInfo}","fid-unregister-failed":"A problem occurred while unregistering the FCM registration via FID: {$errorInfo}","fid-registration-idb-schema-unavailable":"Unable to read or persist FID registration metadata because the messaging IndexedDB schema is unavailable (for example, the database could not be upgraded to the latest version).","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used.","invalid-on-registered-handler":"No onRegistered callback handler was provided or registered. Implement onRegistered() before register()."},d=new m("messaging","Messaging",Xr);var Tt="firebase-messaging-database",At=2,_="firebase-messaging-store",g="firebase-messaging-fid-registration-store",Zr={openDB:v,deleteDB:N},Dt=Zr,B=null;function ei(e,t,n){switch(t){case 0:if(e.createObjectStore(_),n===1)break;case 1:n===2&&e.createObjectStore(g)}}function Ct(e){return{upgrade:(t,n)=>{ei(t,n,e)},blocked:()=>{},blocking:(t,n,r)=>{B=null,r.target?.close()},terminated:()=>{B=null}}}function C(){return B||(B=Dt.openDB(Tt,At,Ct(2)).catch(()=>Dt.openDB(Tt,At-1,Ct(1)))),B}function Lt(e,t){return e.objectStoreNames.contains(t)}function Oe(e){if(!Lt(e,g))throw d.create("fid-registration-idb-schema-unavailable")}async function Re(e){let t=k(e),r=await(await C()).transaction(_).objectStore(_).get(t);if(r)return r;{let i=await Qr(e.appConfig.senderId);if(i)return await Ne(e,i),i}}async function Ne(e,t){let n=k(e),r=await C(),i=[_],o=Lt(r,g);o&&i.push(g);let s=r.transaction(i,"readwrite");return await s.objectStore(_).put(t,n),o&&await s.objectStore(g).delete(n),await s.done,t}async function ti(e){let t=k(e),r=(await C()).transaction(_,"readwrite");await r.objectStore(_).delete(t),await r.done}async function Me(e){let t=k(e),n=await C();return Oe(n),await n.transaction(g).objectStore(g).get(t)}async function ni(e,t){let n=k(e),r=await C();Oe(r);let i=r.transaction([_,g],"readwrite");return await i.objectStore(g).put(t,n),await i.objectStore(_).delete(n),await i.done,t}async function ri(e){let t=k(e),n=await C();Oe(n);let r=n.transaction(g,"readwrite");await r.objectStore(g).delete(t),await r.done}function k({appConfig:e}){return e.appId}var ii="0.13.3";var oi=3,si=1e3;async function ai(e,t){let n=await P(e),r=xe(t,e.appConfig.appName,!1),i={method:"POST",headers:n,body:JSON.stringify(r)},o;try{o=await(await fetch(L(e.appConfig),i)).json()}catch(s){throw d.create("token-subscribe-failed",{errorInfo:s?.toString()})}if(o.error){let s=o.error.message;throw d.create("token-subscribe-failed",{errorInfo:s})}if(!o.token)throw d.create("token-subscribe-no-token");return o.token}async function ci(e,t){let n=await P(e),r=xe(t,e.appConfig.appName,!0),i={method:"POST",headers:n,body:JSON.stringify(r)},o;try{o=await hi(()=>fetch(L(e.appConfig),i),oi,si)}catch(u){throw d.create("fid-registration-failed",{errorInfo:u?.toString()})}if(o.ok)return{responseFid:await fi(o)};let s;try{s=await o.json()}catch{throw d.create("fid-registration-failed",{errorInfo:o.statusText})}let c=s.error?.message??o.statusText;throw d.create("fid-registration-failed",{errorInfo:c})}async function ui(e,t){let r={method:"DELETE",headers:await P(e)},i;try{i=await fetch(`${L(e.appConfig)}/${t}`,r)}catch(o){throw d.create("fid-unregister-failed",{errorInfo:o?.toString()})}if(!i.ok)try{throw(await i.json()).error?.message??i.statusText}catch(o){throw d.create("fid-unregister-failed",{errorInfo:typeof o=="string"&&o||i.statusText||o?.toString()})}}async function fi(e){let t=await e.text();if(!t.trim())throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is empty"});let n;try{n=JSON.parse(t)}catch{throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is not valid JSON"})}let r=n.name;if(typeof r!="string"||r.length===0)throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response did not include a non-empty name"});return di(r)}var kt="/registrations/";function di(e){let t=e.indexOf(kt);if(t!==-1){let n=e.slice(t+kt.length);if(n.length>0)return n}throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response name is not a valid registration resource name"})}async function li(e,t){let n=await P(e),r=xe(t.subscriptionOptions,e.appConfig.appName,!1),i={method:"PATCH",headers:n,body:JSON.stringify(r)},o;try{o=await(await fetch(`${L(e.appConfig)}/${t.token}`,i)).json()}catch(s){throw d.create("token-update-failed",{errorInfo:s?.toString()})}if(o.error){let s=o.error.message;throw d.create("token-update-failed",{errorInfo:s})}if(!o.token)throw d.create("token-update-no-token");return o.token}async function Pt(e,t){let r={method:"DELETE",headers:await P(e)};try{let o=await(await fetch(`${L(e.appConfig)}/${t}`,r)).json();if(o.error){let s=o.error.message;throw d.create("token-unsubscribe-failed",{errorInfo:s})}}catch(i){throw d.create("token-unsubscribe-failed",{errorInfo:i?.toString()})}}async function hi(e,t,n){let r;for(let i=0;i<t;i++)try{return await e()}catch(o){if(r=o,i<t-1){let s=n*Math.pow(2,i);await new Promise(c=>setTimeout(c,s))}}throw r}function L({projectId:e}){return`${Vr}/projects/${e}/registrations`}async function P({appConfig:e,installations:t}){let n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function pi(e,t){try{if(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e))return new URL(e).host}catch{}try{if(typeof self<"u"&&self.location?.href)return new URL(e,self.location.origin).host}catch{}return typeof self<"u"&&self.location?.host?self.location.host:t}function xe({p256dh:e,auth:t,endpoint:n,vapidKey:r,swScope:i},o,s){let c={web:{origin:pi(i,o),endpoint:n,auth:t,p256dh:e}};return s&&(c.fcm_sdk_version=ii),r!==ke&&(c.web.applicationPubKey=r),c}var gi=10080*60*1e3;async function bi(e){let t=await _i(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:p(t.getKey("auth")),p256dh:p(t.getKey("p256dh"))},r=await Re(e.firebaseDependencies);if(r){if(Ei(r.subscriptionOptions,n))return Date.now()>=r.createTime+gi?yi(e,{token:r.token,createTime:Date.now(),subscriptionOptions:n}):r.token;try{await Pt(e.firebaseDependencies,r.token)}catch(i){console.warn(i)}return Rt(e.firebaseDependencies,n)}else return Rt(e.firebaseDependencies,n)}async function mi(e,t){await Pt(e.firebaseDependencies,t.token),await ti(e.firebaseDependencies),await $t(e.firebaseDependencies)}async function wi(e){let n=(await Me(e.firebaseDependencies).catch(()=>{}))?.fid;n&&await ui(e.firebaseDependencies,n),await $t(e.firebaseDependencies),n&&Ii(e,n)}async function Ot(e){let t=await Re(e.firebaseDependencies);t?await mi(e,t):await wi(e);let n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function yi(e,t){try{let n=await li(e.firebaseDependencies,t),r={...t,token:n,createTime:Date.now()};return await Ne(e.firebaseDependencies,r),n}catch(n){throw n}}async function Rt(e,t){let r={token:await ai(e,t),createTime:Date.now(),subscriptionOptions:t};return await Ne(e,r),r.token}async function _i(e,t){let n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Ft(t)})}function Ei(e,t){let n=t.vapidKey===e.vapidKey,r=t.endpoint===e.endpoint,i=t.auth===e.auth,o=t.p256dh===e.p256dh;return n&&r&&i&&o}async function $t(e){try{await ri(e)}catch{}}function Si(e,t){let n=e.onRegisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}function Ii(e,t){let n=e.onUnregisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}async function vi(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=ke)}var Nt=3;async function Ti(e,t){let n=await Ai(e.swRegistration,e.vapidKey),r={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:n.endpoint,auth:p(n.getKey("auth")),p256dh:p(n.getKey("p256dh"))},i=e.firebaseDependencies.installations;for(let o=0;o<Nt;o++){let{responseFid:s}=await ci(e.firebaseDependencies,r);if(s===t)return;o<Nt-1&&await i.getToken(!0)}throw d.create("fid-registration-failed",{errorInfo:"CreateRegistration response FID does not match Firebase Installation ID"})}async function Ai(e,t){let n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Ft(t)})}async function Di(e){let t=await Me(e.firebaseDependencies).catch(()=>{});if(!t)return;await vi(e,t.vapidKey);let n=await e.firebaseDependencies.installations.getId();return await Ti(e,n),await ni(e.firebaseDependencies,{fid:n,lastRegisterTime:Date.now(),vapidKey:e.vapidKey}),Si(e,n),n}function Ci(e){let t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return ki(t,e),Oi(t,e),Ri(t,e),t}function ki(e,t){if(!t.notification)return;e.notification={};let n=t.notification.title;n&&(e.notification.title=n);let r=t.notification.body;r&&(e.notification.body=r);let i=t.notification.image;i&&(e.notification.image=i);let o=t.notification.icon;o&&(e.notification.icon=o)}function Oi(e,t){t.data&&(e.data=t.data)}function Ri(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};let n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);let r=t.fcmOptions?.analytics_label;r&&(e.fcmOptions.analyticsLabel=r)}function Ni(e){return typeof e=="object"&&!!e&&Kr in e}function Mi(e){return new Promise(t=>{setTimeout(t,e)})}var xi="https://play.google.com/log?format=json_proto3",jt=0,Bi=Vi("AzSCbw63g1R0nCw85jG8","Iaya3yLKwmgvh7cF0q4");function Fi(e){e.logQueue.state==="stopped"&&e.logEvents.length>0&&Be(e,jt)}function Be(e,t){if(e.logQueue.state==="scheduled"&&clearTimeout(e.logQueue.timerId),e.logQueue={state:"stopped"},!e.deliveryMetricsExportedToBigQueryEnabled){e.logEvents=[];return}e.logQueue={state:"scheduled",timerId:setTimeout(async()=>{if(e.logQueue={state:"flushing"},!e.logEvents.length)return Be(e,Bt);await Li(e)},t)}}async function Li(e){let t=e.logEvents;e.logEvents=[];for(let n=0,r=t.length;n<r;n+=St){let i=t.slice(n,n+St);if(!i.length)break;let o=Ui(i),s=0,c={};do{try{if(c=await fetch(xi.concat("&key=",Bi),{method:"POST",body:JSON.stringify(o)}),c.ok||!c.ok&&!Mt(c))break;if(!c.ok&&Mt(c))throw new Error("a retriable Non-200 code is returned in fetch to Firelog endpoint. Retry")}catch{if(s===It)break}let u;try{u=Number((await c.json()).nextRequestWaitMillis)}catch{u=Wr}await new Promise(a=>setTimeout(a,u)),s++}while(s<It)}Be(e,e.logEvents.length?jt:Bt)}function Mt(e){let t=e.status;return t===429||t===500||t===503||t===504}async function Pi(e,t){let n=$i(t,await e.firebaseDependencies.installations.getId());ji(e,n,t.productId),Fi(e)}function $i(e,t){let n={};return e.from&&(n.project_number=e.from),e.fcmMessageId&&(n.message_id=e.fcmMessageId),n.instance_id=t,e.notification?n.message_type=X.DISPLAY_NOTIFICATION.toString():n.message_type=X.DATA_MESSAGE.toString(),n.sdk_platform=qr.toString(),n.package_name=self.origin.replace(/(^\w+:|^)\/\//,""),e.collapse_key&&(n.collapse_key=e.collapse_key),n.event=Gr.toString(),e.fcmOptions?.analytics_label&&(n.analytics_label=e.fcmOptions?.analytics_label),n}function ji(e,t,n){let r={};r.event_time_ms=Math.floor(Date.now()).toString(),r.source_extension_json_proto3=JSON.stringify({messaging_client_event:t}),n&&(r.compliance_data=Hi(n)),e.logEvents.push(r)}function Hi(e){return{privacy_context:{prequest:{origin_associated_product_id:e}}}}function Ui(e){let t={};return t.log_source=zr.toString(),t.log_event=e,t}function Vi(e,t){let n=[];for(let r=0;r<e.length;r++)n.push(e.charAt(r)),r<t.length&&n.push(t.charAt(r));return n.join("")}async function Ki(e,t){t.swRegistration||(t.swRegistration=self.registration);let{newSubscription:n}=e;if(!n){await Ot(t);return}if(await Me(t.firebaseDependencies).catch(()=>{})){let o=await Di(t).catch(()=>{});if(o){let s=await Fe();Ht(s)&&Yi(s,o)}return}let i=await Re(t.firebaseDependencies);await Ot(t),t.vapidKey=i?.subscriptionOptions?.vapidKey??ke,await bi(t)}async function Wi(e,t){let n=Gi(e);if(!n)return;t.deliveryMetricsExportedToBigQueryEnabled&&await Pi(t,n);let r=await Fe();if(Ht(r))return Qi(r,n);if(n.notification&&await Xi(qi(n)),!!t&&t.onBackgroundMessageHandler){let i=Ci(n);typeof t.onBackgroundMessageHandler=="function"?await t.onBackgroundMessageHandler(i):t.onBackgroundMessageHandler.next(i)}}async function zi(e){let t=e.notification?.data?.[xt];if(t){if(e.action)return}else return;e.stopImmediatePropagation(),e.notification.close();let n=Zi(t);if(!n)return;let r=new URL(n,self.location.href),i=new URL(self.location.origin);if(r.host!==i.host)return;let o=await Ji(r);if(o?o=await o.focus():(o=await self.clients.openWindow(n),await Mi(3e3)),!!o)return t.messageType=F.NOTIFICATION_CLICKED,t.isFirebaseMessaging=!0,o.postMessage(t)}function qi(e){let t={...e.notification};return t.data={[xt]:e},t}function Gi({data:e}){if(!e)return null;try{return e.json()}catch{return null}}async function Ji(e){let t=await Fe();for(let n of t){let r=new URL(n.url,self.location.href);if(e.host===r.host)return n}return null}function Ht(e){return e.some(t=>t.visibilityState==="visible"&&!t.url.startsWith("chrome-extension://"))}function Qi(e,t){t.isFirebaseMessaging=!0,t.messageType=F.PUSH_RECEIVED;for(let n of e)n.postMessage(t)}function Yi(e,t){let n={isFirebaseMessaging:!0,messageType:F.FID_REGISTERED,fid:t};for(let r of e)r.postMessage(n)}function Fe(){return self.clients.matchAll({type:"window",includeUncontrolled:!0})}function Xi(e){let{actions:t}=e,{maxActions:n}=Notification;return t&&n&&t.length>n&&console.warn(`This browser only supports ${n} actions. The remaining actions will not be displayed.`),self.registration.showNotification(e.title??"",e)}function Zi(e){let t=e.fcmOptions?.link??e.notification?.click_action;return t||(Ni(e.data)?self.location.origin:null)}function eo(e){if(!e||!e.options)throw De("App Configuration Object");if(!e.name)throw De("App Name");let t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(let r of t)if(!n[r])throw De(r);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function De(e){return d.create("missing-app-config-values",{valueName:e})}var Ce=class{constructor(t,n,r){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.onRegisteredHandler=null,this.onUnregisteredHandler=null,this._registerNotifyChain=Promise.resolve(),this._fidChangeUnsubscribe=null,this.logEvents=[],this.logQueue={state:"stopped"};let i=eo(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:r}}_delete(){return this._fidChangeUnsubscribe&&(this._fidChangeUnsubscribe(),this._fidChangeUnsubscribe=null),this.logQueue.state==="scheduled"&&clearTimeout(this.logQueue.timerId),this.logQueue={state:"stopped"},Promise.resolve()}};var to=e=>{let t=new Ce(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return self.addEventListener("push",n=>{n.waitUntil(Wi(n,t))}),self.addEventListener("pushsubscriptionchange",n=>{n.waitUntil(Ki(n,t))}),self.addEventListener("notificationclick",n=>{n.waitUntil(zi(n))}),t};function no(){S(new l("messaging-sw",to,"PUBLIC"))}async function ro(){return U()&&await V()&&"PushManager"in self&&"Notification"in self&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}function io(e,t){if(self.document!==void 0)throw d.create("only-available-in-sw");return e.onBackgroundMessageHandler=t,()=>{e.onBackgroundMessageHandler=null}}function Ut(e=we()){return ro().then(t=>{if(!t)throw d.create("unsupported-browser")},t=>{throw d.create("indexed-db-unsupported")}),x(ne(e),"messaging-sw").getImmediate()}function Vt(e,t){return e=ne(e),io(e,t)}no();self.importScripts("/firebase-config.js");var Le=self.HERUPU_FIREBASE;self.addEventListener("notificationclick",e=>{e.notification.close(),e.waitUntil((async()=>{let t=await self.clients.matchAll({type:"window",includeUncontrolled:!0});for(let n of t)if("focus"in n)return n.focus();return self.clients.openWindow("/")})())});if(Le&&Le.apiKey){let e=Ut(me(Le));Vt(e,t=>{if(t.notification)return;let n=t.data||{};self.registration.showNotification(n.titulo||"HERUPU T\xE9cnico",{body:n.corpo||"Voc\xEA tem uma atualiza\xE7\xE3o.",icon:"/icon-192.png",badge:"/icon-192.png",tag:n.tipo||"herupu",renotify:!0,requireInteraction:n.tipo==="dispatch_oferta",vibrate:[500,200,500,200,500]})})}})();
/*! Bundled license information:

@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/logger/dist/esm/index.esm.js:
@firebase/messaging/dist/esm/index.sw.esm.js:
@firebase/messaging/dist/esm/index.sw.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
@firebase/component/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/installations/dist/esm/index.esm.js:
@firebase/installations/dist/esm/index.esm.js:
@firebase/installations/dist/esm/index.esm.js:
@firebase/installations/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
firebase/app/dist/esm/index.esm.js:
@firebase/installations/dist/esm/index.esm.js:
@firebase/messaging/dist/esm/index.sw.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2026 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/installations/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/messaging/dist/esm/index.sw.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
   * in compliance with the License. You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under the License
   * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
   * or implied. See the License for the specific language governing permissions and limitations under
   * the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2026 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/messaging/dist/esm/index.sw.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/messaging/dist/esm/index.sw.esm.js:
  (**
   * @license
   * Copyright 2026 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
