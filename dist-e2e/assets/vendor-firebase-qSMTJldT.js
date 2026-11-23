import"./vendor-firestore-WgoApGpj.js";const _o=()=>{};var ur={};/**
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
 */const zr=function(i){const e=[];let n=0;for(let r=0;r<i.length;r++){let a=i.charCodeAt(r);a<128?e[n++]=a:a<2048?(e[n++]=a>>6|192,e[n++]=a&63|128):(a&64512)===55296&&r+1<i.length&&(i.charCodeAt(r+1)&64512)===56320?(a=65536+((a&1023)<<10)+(i.charCodeAt(++r)&1023),e[n++]=a>>18|240,e[n++]=a>>12&63|128,e[n++]=a>>6&63|128,e[n++]=a&63|128):(e[n++]=a>>12|224,e[n++]=a>>6&63|128,e[n++]=a&63|128)}return e},wo=function(i){const e=[];let n=0,r=0;for(;n<i.length;){const a=i[n++];if(a<128)e[r++]=String.fromCharCode(a);else if(a>191&&a<224){const h=i[n++];e[r++]=String.fromCharCode((a&31)<<6|h&63)}else if(a>239&&a<365){const h=i[n++],l=i[n++],I=i[n++],v=((a&7)<<18|(h&63)<<12|(l&63)<<6|I&63)-65536;e[r++]=String.fromCharCode(55296+(v>>10)),e[r++]=String.fromCharCode(56320+(v&1023))}else{const h=i[n++],l=i[n++];e[r++]=String.fromCharCode((a&15)<<12|(h&63)<<6|l&63)}}return e.join("")},Xn={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(i,e){if(!Array.isArray(i))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let a=0;a<i.length;a+=3){const h=i[a],l=a+1<i.length,I=l?i[a+1]:0,v=a+2<i.length,T=v?i[a+2]:0,P=h>>2,b=(h&3)<<4|I>>4;let k=(I&15)<<2|T>>6,N=T&63;v||(N=64,l||(k=64)),r.push(n[P],n[b],n[k],n[N])}return r.join("")},encodeString(i,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(i):this.encodeByteArray(zr(i),e)},decodeString(i,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(i):wo(this.decodeStringToByteArray(i,e))},decodeStringToByteArray(i,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let a=0;a<i.length;){const h=n[i.charAt(a++)],I=a<i.length?n[i.charAt(a)]:0;++a;const T=a<i.length?n[i.charAt(a)]:64;++a;const b=a<i.length?n[i.charAt(a)]:64;if(++a,h==null||I==null||T==null||b==null)throw new vo;const k=h<<2|I>>4;if(r.push(k),T!==64){const N=I<<4&240|T>>2;if(r.push(N),b!==64){const D=T<<6&192|b;r.push(D)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let i=0;i<this.ENCODED_VALS.length;i++)this.byteToCharMap_[i]=this.ENCODED_VALS.charAt(i),this.charToByteMap_[this.byteToCharMap_[i]]=i,this.byteToCharMapWebSafe_[i]=this.ENCODED_VALS_WEBSAFE.charAt(i),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]]=i,i>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)]=i,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)]=i)}}};class vo extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Io=function(i){const e=zr(i);return Xn.encodeByteArray(e,!0)},zt=function(i){return Io(i).replace(/\./g,"")},Gr=function(i){try{return Xn.decodeString(i,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
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
 */function To(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
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
 */const Eo=()=>To().__FIREBASE_DEFAULTS__,bo=()=>{if(typeof process>"u"||typeof ur>"u")return;const i=ur.__FIREBASE_DEFAULTS__;if(i)return JSON.parse(i)},So=()=>{if(typeof document>"u")return;let i;try{i=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=i&&Gr(i[1]);return e&&JSON.parse(e)},tn=()=>{try{return _o()||Eo()||bo()||So()}catch(i){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${i}`);return}},Kr=i=>{var e,n;return(n=(e=tn())==null?void 0:e.emulatorHosts)==null?void 0:n[i]},Ol=i=>{const e=Kr(i);if(!e)return;const n=e.lastIndexOf(":");if(n<=0||n+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(n+1),10);return e[0]==="["?[e.substring(1,n-1),r]:[e.substring(0,n),r]},qr=()=>{var i;return(i=tn())==null?void 0:i.config},Jr=i=>{var e;return(e=tn())==null?void 0:e[`_${i}`]};/**
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
 */class Fn{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}wrapCallback(e){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(n):e(n,r))}}}/**
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
 */function Dl(i,e){if(i.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n={alg:"none",type:"JWT"},r=e||"demo-project",a=i.iat||0,h=i.sub||i.user_id;if(!h)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const l={iss:`https://securetoken.google.com/${r}`,aud:r,iat:a,exp:a+3600,auth_time:a,sub:h,user_id:h,firebase:{sign_in_provider:"custom",identities:{}},...i};return[zt(JSON.stringify(n)),zt(JSON.stringify(l)),""].join(".")}/**
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
 */function $(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Ao(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test($())}function Xr(){var e;const i=(e=tn())==null?void 0:e.forceEnvironment;if(i==="node")return!0;if(i==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Po(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function ko(){const i=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof i=="object"&&i.id!==void 0}function Co(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Ro(){const i=$();return i.indexOf("MSIE ")>=0||i.indexOf("Trident/")>=0}function Nl(){return!Xr()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Ml(){return!Xr()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function Yr(){try{return typeof indexedDB=="object"}catch{return!1}}function Oo(){return new Promise((i,e)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",a=self.indexedDB.open(r);a.onsuccess=()=>{a.result.close(),n||self.indexedDB.deleteDatabase(r),i(!0)},a.onupgradeneeded=()=>{n=!1},a.onerror=()=>{var h;e(((h=a.error)==null?void 0:h.message)||"")}}catch(n){e(n)}})}/**
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
 */const Do="FirebaseError";class Se extends Error{constructor(e,n,r){super(n),this.code=e,this.customData=r,this.name=Do,Object.setPrototypeOf(this,Se.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ze.prototype.create)}}class ze{constructor(e,n,r){this.service=e,this.serviceName=n,this.errors=r}create(e,...n){const r=n[0]||{},a=`${this.service}/${e}`,h=this.errors[e],l=h?No(h,r):"Error",I=`${this.serviceName}: ${l} (${a}).`;return new Se(a,I,r)}}function No(i,e){try{let n=0,r="";for(;n<i.length;){const a=i.indexOf("{$",n);if(a===-1){r+=i.substring(n);break}const h=i.indexOf("}",a+2);if(h===-1){r+=i.substring(n);break}const l=i.substring(a+2,h),I=e[l];r+=i.substring(n,a)+(I!=null?String(I):`<${l}?>`),n=h+1}return r}catch{return i}}function Mo(i){for(const e in i)if(Object.prototype.hasOwnProperty.call(i,e))return!1;return!0}function Ve(i,e){if(i===e)return!0;const n=Object.keys(i),r=Object.keys(e);for(const a of n){if(!r.includes(a))return!1;const h=i[a],l=e[a];if(fr(h)&&fr(l)){if(!Ve(h,l))return!1}else if(h!==l)return!1}for(const a of r)if(!n.includes(a))return!1;return!0}function fr(i){return i!==null&&typeof i=="object"}/**
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
 */function pt(i){const e=[];for(const[n,r]of Object.entries(i))Array.isArray(r)?r.forEach(a=>{e.push(encodeURIComponent(n)+"="+encodeURIComponent(a))}):e.push(encodeURIComponent(n)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function Lo(i,e){const n=new Uo(i,e);return n.subscribe.bind(n)}class Uo{constructor(e,n){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=n,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(n=>{n.next(e)})}error(e){this.forEachObserver(n=>{n.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,n,r){let a;if(e===void 0&&n===void 0&&r===void 0)throw new Error("Missing Observer.");xo(e,["next","error","complete"])?a=e:a={next:e,error:n,complete:r},a.next===void 0&&(a.next=Dn),a.error===void 0&&(a.error=Dn),a.complete===void 0&&(a.complete=Dn);const h=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?a.error(this.finalError):a.complete()}catch{}}),this.observers.push(a),h}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let n=0;n<this.observers.length;n++)this.sendOne(n,e)}sendOne(e,n){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{n(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function xo(i,e){if(typeof i!="object"||i===null)return!1;for(const n of e)if(n in i&&typeof i[n]=="function")return!0;return!1}function Dn(){}/**
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
 */function ne(i){return i&&i._delegate?i._delegate:i}/**
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
 */function Yn(i){try{return(i.startsWith("http://")||i.startsWith("https://")?new URL(i).hostname:i).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Bo(i){return(await fetch(i,{credentials:"include"})).ok}class be{constructor(e,n,r){this.name=e,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */const De="[DEFAULT]";/**
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
 */class Fo{constructor(e,n){this.name=e,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const r=new Fn;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const a=this.getOrInitializeService({instanceIdentifier:n});a&&r.resolve(a)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(e){const n=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(a){if(r)return null;throw a}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Ho(e))try{this.getOrInitializeService({instanceIdentifier:De})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(n);try{const h=this.getOrInitializeService({instanceIdentifier:a});r.resolve(h)}catch{}}}}clearInstance(e=De){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...e.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=De){return this.instances.has(e)}getOptions(e=De){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:n={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const a=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[h,l]of this.instancesDeferred.entries()){const I=this.normalizeInstanceIdentifier(h);r===I&&l.resolve(a)}return a}onInit(e,n){const r=this.normalizeInstanceIdentifier(n),a=this.onInitCallbacks.get(r)??new Set;a.add(e),this.onInitCallbacks.set(r,a);const h=this.instances.get(r);return h&&e(h,r),()=>{a.delete(e)}}invokeOnInitCallbacks(e,n){const r=this.onInitCallbacks.get(n);if(r)for(const a of r)try{a(e,n)}catch{}}getOrInitializeService({instanceIdentifier:e,options:n={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:jo(e),options:n}),this.instances.set(e,r),this.instancesOptions.set(e,n),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=De){return this.component?this.component.multipleInstances?e:De:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function jo(i){return i===De?void 0:i}function Ho(i){return i.instantiationMode==="EAGER"}/**
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
 */class $o{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const n=this.getProvider(e.name);if(n.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);n.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const n=new Fo(e,this);return this.providers.set(e,n),n}getProviders(){return Array.from(this.providers.values())}}/**
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
 */var R;(function(i){i[i.DEBUG=0]="DEBUG",i[i.VERBOSE=1]="VERBOSE",i[i.INFO=2]="INFO",i[i.WARN=3]="WARN",i[i.ERROR=4]="ERROR",i[i.SILENT=5]="SILENT"})(R||(R={}));const Vo={debug:R.DEBUG,verbose:R.VERBOSE,info:R.INFO,warn:R.WARN,error:R.ERROR,silent:R.SILENT},Wo=R.INFO,zo={[R.DEBUG]:"log",[R.VERBOSE]:"log",[R.INFO]:"info",[R.WARN]:"warn",[R.ERROR]:"error"},Go=(i,e,...n)=>{if(e<i.logLevel)return;const r=new Date().toISOString(),a=zo[e];if(a)console[a](`[${r}]  ${i.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Qn{constructor(e){this.name=e,this._logLevel=Wo,this._logHandler=Go,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in R))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Vo[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,R.DEBUG,...e),this._logHandler(this,R.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,R.VERBOSE,...e),this._logHandler(this,R.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,R.INFO,...e),this._logHandler(this,R.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,R.WARN,...e),this._logHandler(this,R.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,R.ERROR,...e),this._logHandler(this,R.ERROR,...e)}}const Ko=(i,e)=>e.some(n=>i instanceof n);let dr,pr;function qo(){return dr||(dr=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Jo(){return pr||(pr=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Qr=new WeakMap,jn=new WeakMap,Zr=new WeakMap,Nn=new WeakMap,Zn=new WeakMap;function Xo(i){const e=new Promise((n,r)=>{const a=()=>{i.removeEventListener("success",h),i.removeEventListener("error",l)},h=()=>{n(Te(i.result)),a()},l=()=>{r(i.error),a()};i.addEventListener("success",h),i.addEventListener("error",l)});return e.then(n=>{n instanceof IDBCursor&&Qr.set(n,i)}).catch(()=>{}),Zn.set(e,i),e}function Yo(i){if(jn.has(i))return;const e=new Promise((n,r)=>{const a=()=>{i.removeEventListener("complete",h),i.removeEventListener("error",l),i.removeEventListener("abort",l)},h=()=>{n(),a()},l=()=>{r(i.error||new DOMException("AbortError","AbortError")),a()};i.addEventListener("complete",h),i.addEventListener("error",l),i.addEventListener("abort",l)});jn.set(i,e)}let Hn={get(i,e,n){if(i instanceof IDBTransaction){if(e==="done")return jn.get(i);if(e==="objectStoreNames")return i.objectStoreNames||Zr.get(i);if(e==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return Te(i[e])},set(i,e,n){return i[e]=n,!0},has(i,e){return i instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in i}};function Qo(i){Hn=i(Hn)}function Zo(i){return i===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...n){const r=i.call(Mn(this),e,...n);return Zr.set(r,e.sort?e.sort():[e]),Te(r)}:Jo().includes(i)?function(...e){return i.apply(Mn(this),e),Te(Qr.get(this))}:function(...e){return Te(i.apply(Mn(this),e))}}function ea(i){return typeof i=="function"?Zo(i):(i instanceof IDBTransaction&&Yo(i),Ko(i,qo())?new Proxy(i,Hn):i)}function Te(i){if(i instanceof IDBRequest)return Xo(i);if(Nn.has(i))return Nn.get(i);const e=ea(i);return e!==i&&(Nn.set(i,e),Zn.set(e,i)),e}const Mn=i=>Zn.get(i);function ta(i,e,{blocked:n,upgrade:r,blocking:a,terminated:h}={}){const l=indexedDB.open(i,e),I=Te(l);return r&&l.addEventListener("upgradeneeded",v=>{r(Te(l.result),v.oldVersion,v.newVersion,Te(l.transaction),v)}),n&&l.addEventListener("blocked",v=>n(v.oldVersion,v.newVersion,v)),I.then(v=>{h&&v.addEventListener("close",()=>h()),a&&v.addEventListener("versionchange",T=>a(T.oldVersion,T.newVersion,T))}).catch(()=>{}),I}const na=["get","getKey","getAll","getAllKeys","count"],ia=["put","add","delete","clear"],Ln=new Map;function gr(i,e){if(!(i instanceof IDBDatabase&&!(e in i)&&typeof e=="string"))return;if(Ln.get(e))return Ln.get(e);const n=e.replace(/FromIndex$/,""),r=e!==n,a=ia.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(a||na.includes(n)))return;const h=async function(l,...I){const v=this.transaction(l,a?"readwrite":"readonly");let T=v.store;return r&&(T=T.index(I.shift())),(await Promise.all([T[n](...I),a&&v.done]))[0]};return Ln.set(e,h),h}Qo(i=>({...i,get:(e,n,r)=>gr(e,n)||i.get(e,n,r),has:(e,n)=>!!gr(e,n)||i.has(e,n)}));/**
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
 */class ra{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(sa(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function sa(i){const e=i.getComponent();return(e==null?void 0:e.type)==="VERSION"}const $n="@firebase/app",mr="0.16.7";/**
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
 */const ee=new Qn("@firebase/app"),oa="@firebase/app-compat",aa="@firebase/analytics-compat",ca="@firebase/analytics",ha="@firebase/app-check-compat",la="@firebase/app-check",ua="@firebase/auth",fa="@firebase/auth-compat",da="@firebase/crashlytics",pa="@firebase/database",ga="@firebase/data-connect",ma="@firebase/database-compat",ya="@firebase/functions",_a="@firebase/functions-compat",wa="@firebase/installations",va="@firebase/installations-compat",Ia="@firebase/messaging",Ta="@firebase/messaging-compat",Ea="@firebase/performance",ba="@firebase/performance-compat",Sa="@firebase/remote-config",Aa="@firebase/remote-config-compat",Pa="@firebase/storage",ka="@firebase/storage-compat",Ca="@firebase/firestore",Ra="@firebase/ai",Oa="@firebase/firestore-compat",Da="firebase",Na="13.4.0";/**
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
 */const Gt="[DEFAULT]",Ma={[$n]:"fire-core",[oa]:"fire-core-compat",[ca]:"fire-analytics",[aa]:"fire-analytics-compat",[la]:"fire-app-check",[ha]:"fire-app-check-compat",[ua]:"fire-auth",[fa]:"fire-auth-compat",[da]:"fire-cls",[pa]:"fire-rtdb",[ga]:"fire-data-connect",[ma]:"fire-rtdb-compat",[ya]:"fire-fn",[_a]:"fire-fn-compat",[wa]:"fire-iid",[va]:"fire-iid-compat",[Ia]:"fire-fcm",[Ta]:"fire-fcm-compat",[Ea]:"fire-perf",[ba]:"fire-perf-compat",[Sa]:"fire-rc",[Aa]:"fire-rc-compat",[Pa]:"fire-gcs",[ka]:"fire-gcs-compat",[Ca]:"fire-fst",[Oa]:"fire-fst-compat",[Ra]:"fire-vertex","fire-js":"fire-js",[Da]:"fire-js-all"};/**
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
 */const Kt=new Map,La=new Map,Vn=new Map;function yr(i,e){try{i.container.addComponent(e)}catch(n){ee.debug(`Component ${e.name} failed to register with FirebaseApp ${i.name}`,n)}}function Le(i){const e=i.name;if(Vn.has(e))return ee.debug(`There were multiple attempts to register component ${e}.`),!1;Vn.set(e,i);for(const n of Kt.values())yr(n,i);for(const n of La.values())yr(n,i);return!0}function ei(i,e){const n=i.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),i.container.getProvider(e)}function Ll(i,e,n=Gt){ei(i,e).clearInstance(n)}function G(i){return i==null?!1:i.settings!==void 0}/**
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
 */const Ua={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},ie=new ze("app","Firebase",Ua);/**
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
 */class xa{constructor(e,n,r){this._isDeleted=!1,this._options={...e},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new be("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw ie.create("app-deleted",{appName:this._name})}}/**
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
 */const gt=Na;function Ba(i,e={}){let n=i;typeof e!="object"&&(e={name:e});const r={name:Gt,automaticDataCollectionEnabled:!0,...e},a=r.name;if(typeof a!="string"||!a)throw ie.create("bad-app-name",{appName:String(a)});if(n||(n=qr()),!n)throw ie.create("no-options");const h=Kt.get(a);if(h)if(Ve(n,h.options)){if(Ve(r,h.config))return h;throw ie.create("duplicate-app",{appName:a,mismatchedParam:"config",oldValue:JSON.stringify(h.config),newValue:JSON.stringify(r)})}else throw ie.create("duplicate-app",{appName:a,mismatchedParam:"options",oldValue:JSON.stringify(h.options),newValue:JSON.stringify(n)});const l=new $o(a);for(const v of Vn.values())l.addComponent(v);const I=new xa(n,r,l);return Kt.set(a,I),I}function Fa(i=Gt){const e=Kt.get(i);if(!e&&i===Gt&&qr())return Ba();if(!e)throw ie.create("no-app",{appName:i});return e}function Ne(i,e,n){let r=Ma[i]??i;n&&(r+=`-${n}`);const a=r.match(/\s|\//),h=e.match(/\s|\//);if(a||h){const l=[`Unable to register library "${r}" with version "${e}":`];a&&l.push(`library name "${r}" contains illegal characters (whitespace or "/")`),a&&h&&l.push("and"),h&&l.push(`version name "${e}" contains illegal characters (whitespace or "/")`),ee.warn(l.join(" "));return}Le(new be(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
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
 */const ja="firebase-heartbeat-database",Ha=1,ft="firebase-heartbeat-store";let Un=null;function es(){return Un||(Un=ta(ja,Ha,{upgrade:(i,e)=>{switch(e){case 0:try{i.createObjectStore(ft)}catch(n){console.warn(n)}}}}).catch(i=>{throw ie.create("idb-open",{originalErrorMessage:i.message})})),Un}async function $a(i){try{const n=(await es()).transaction(ft),r=await n.objectStore(ft).get(ts(i));return await n.done,r}catch(e){if(e instanceof Se)ee.warn(e.message);else{const n=ie.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});ee.warn(n.message)}}}async function _r(i,e){try{const r=(await es()).transaction(ft,"readwrite");await r.objectStore(ft).put(e,ts(i)),await r.done}catch(n){if(n instanceof Se)ee.warn(n.message);else{const r=ie.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});ee.warn(r.message)}}}function ts(i){return`${i.name}!${i.options.appId}`}/**
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
 */const Va=1024,Wa=30;class za{constructor(e){this.container=e,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new Ka(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,n;try{const a=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),h=wr();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===h||this._heartbeatsCache.heartbeats.some(l=>l.date===h))return;if(this._heartbeatsCache.heartbeats.push({date:h,agent:a}),this._heartbeatsCache.heartbeats.length>Wa){const l=qa(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(l,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){ee.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=wr(),{heartbeatsToSend:r,unsentEntries:a}=Ga(this._heartbeatsCache.heartbeats),h=zt(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,a.length>0?(this._heartbeatsCache.heartbeats=a,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),h}catch(n){return ee.warn(n),""}}}function wr(){return new Date().toISOString().substring(0,10)}function Ga(i,e=Va){const n=[];let r=i.slice();for(const a of i){const h=n.find(l=>l.agent===a.agent);if(h){if(h.dates.push(a.date),vr(n)>e){h.dates.pop();break}}else if(n.push({agent:a.agent,dates:[a.date]}),vr(n)>e){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class Ka{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Yr()?Oo().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await $a(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return _r(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return _r(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function vr(i){return zt(JSON.stringify({version:2,heartbeats:i})).length}function qa(i){if(i.length===0)return-1;let e=0,n=i[0].date;for(let r=1;r<i.length;r++)i[r].date<n&&(n=i[r].date,e=r);return e}/**
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
 */function Ja(i){Le(new be("platform-logger",e=>new ra(e),"PRIVATE")),Le(new be("heartbeat",e=>new za(e),"PRIVATE")),Ne($n,mr,i),Ne($n,mr,"esm2020"),Ne("fire-js","")}/**
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
 */const Wn="firebase-js-sdk-policy",Xa=["https://www.googletagmanager.com/gtag/js","https://apis.google.com/js/api.js","https://www.google.com/recaptcha/api.js","https://www.google.com/recaptcha/enterprise.js"];let Ut,ns=!1;function is(i){if(!Xa.some(n=>i.startsWith(n)&&(i.length===n.length||i.charAt(n.length)==="?")))throw new TypeError(`Firebase: Refusing to load untrusted script URL: ${i}`);return i}function Ya(){if(Ut===void 0){Ut=null;const i=typeof window<"u"?window.trustedTypes:void 0;if(i!=null&&i.createPolicy)try{Ut=i.createPolicy(Wn,{createScriptURL:is})}catch{ns=!0}}return Ut}function Qa(i,e){is(e);const n=Ya();if(n){i.src=n.createScriptURL(e);return}try{i.src=e}catch(r){throw ns&&ee.error(`Unable to load ${e} because this page requires Trusted Types for scripts but does not allow the "${Wn}" Trusted Types policy. To fix this, add "${Wn}" to the trusted-types directive of the page's Content-Security-Policy.`),r}}/**
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
 */Ja("");var Ir=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Za,ec;(function(){var i;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(g,u){function d(){}d.prototype=u.prototype,g.F=u.prototype,g.prototype=new d,g.prototype.constructor=g,g.D=function(m,p,_){for(var f=Array(arguments.length-2),V=2;V<arguments.length;V++)f[V-2]=arguments[V];return u.prototype[p].apply(m,f)}}function n(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,n),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function a(g,u,d){d||(d=0);const m=Array(16);if(typeof u=="string")for(var p=0;p<16;++p)m[p]=u.charCodeAt(d++)|u.charCodeAt(d++)<<8|u.charCodeAt(d++)<<16|u.charCodeAt(d++)<<24;else for(p=0;p<16;++p)m[p]=u[d++]|u[d++]<<8|u[d++]<<16|u[d++]<<24;u=g.g[0],d=g.g[1],p=g.g[2];let _=g.g[3],f;f=u+(_^d&(p^_))+m[0]+3614090360&4294967295,u=d+(f<<7&4294967295|f>>>25),f=_+(p^u&(d^p))+m[1]+3905402710&4294967295,_=u+(f<<12&4294967295|f>>>20),f=p+(d^_&(u^d))+m[2]+606105819&4294967295,p=_+(f<<17&4294967295|f>>>15),f=d+(u^p&(_^u))+m[3]+3250441966&4294967295,d=p+(f<<22&4294967295|f>>>10),f=u+(_^d&(p^_))+m[4]+4118548399&4294967295,u=d+(f<<7&4294967295|f>>>25),f=_+(p^u&(d^p))+m[5]+1200080426&4294967295,_=u+(f<<12&4294967295|f>>>20),f=p+(d^_&(u^d))+m[6]+2821735955&4294967295,p=_+(f<<17&4294967295|f>>>15),f=d+(u^p&(_^u))+m[7]+4249261313&4294967295,d=p+(f<<22&4294967295|f>>>10),f=u+(_^d&(p^_))+m[8]+1770035416&4294967295,u=d+(f<<7&4294967295|f>>>25),f=_+(p^u&(d^p))+m[9]+2336552879&4294967295,_=u+(f<<12&4294967295|f>>>20),f=p+(d^_&(u^d))+m[10]+4294925233&4294967295,p=_+(f<<17&4294967295|f>>>15),f=d+(u^p&(_^u))+m[11]+2304563134&4294967295,d=p+(f<<22&4294967295|f>>>10),f=u+(_^d&(p^_))+m[12]+1804603682&4294967295,u=d+(f<<7&4294967295|f>>>25),f=_+(p^u&(d^p))+m[13]+4254626195&4294967295,_=u+(f<<12&4294967295|f>>>20),f=p+(d^_&(u^d))+m[14]+2792965006&4294967295,p=_+(f<<17&4294967295|f>>>15),f=d+(u^p&(_^u))+m[15]+1236535329&4294967295,d=p+(f<<22&4294967295|f>>>10),f=u+(p^_&(d^p))+m[1]+4129170786&4294967295,u=d+(f<<5&4294967295|f>>>27),f=_+(d^p&(u^d))+m[6]+3225465664&4294967295,_=u+(f<<9&4294967295|f>>>23),f=p+(u^d&(_^u))+m[11]+643717713&4294967295,p=_+(f<<14&4294967295|f>>>18),f=d+(_^u&(p^_))+m[0]+3921069994&4294967295,d=p+(f<<20&4294967295|f>>>12),f=u+(p^_&(d^p))+m[5]+3593408605&4294967295,u=d+(f<<5&4294967295|f>>>27),f=_+(d^p&(u^d))+m[10]+38016083&4294967295,_=u+(f<<9&4294967295|f>>>23),f=p+(u^d&(_^u))+m[15]+3634488961&4294967295,p=_+(f<<14&4294967295|f>>>18),f=d+(_^u&(p^_))+m[4]+3889429448&4294967295,d=p+(f<<20&4294967295|f>>>12),f=u+(p^_&(d^p))+m[9]+568446438&4294967295,u=d+(f<<5&4294967295|f>>>27),f=_+(d^p&(u^d))+m[14]+3275163606&4294967295,_=u+(f<<9&4294967295|f>>>23),f=p+(u^d&(_^u))+m[3]+4107603335&4294967295,p=_+(f<<14&4294967295|f>>>18),f=d+(_^u&(p^_))+m[8]+1163531501&4294967295,d=p+(f<<20&4294967295|f>>>12),f=u+(p^_&(d^p))+m[13]+2850285829&4294967295,u=d+(f<<5&4294967295|f>>>27),f=_+(d^p&(u^d))+m[2]+4243563512&4294967295,_=u+(f<<9&4294967295|f>>>23),f=p+(u^d&(_^u))+m[7]+1735328473&4294967295,p=_+(f<<14&4294967295|f>>>18),f=d+(_^u&(p^_))+m[12]+2368359562&4294967295,d=p+(f<<20&4294967295|f>>>12),f=u+(d^p^_)+m[5]+4294588738&4294967295,u=d+(f<<4&4294967295|f>>>28),f=_+(u^d^p)+m[8]+2272392833&4294967295,_=u+(f<<11&4294967295|f>>>21),f=p+(_^u^d)+m[11]+1839030562&4294967295,p=_+(f<<16&4294967295|f>>>16),f=d+(p^_^u)+m[14]+4259657740&4294967295,d=p+(f<<23&4294967295|f>>>9),f=u+(d^p^_)+m[1]+2763975236&4294967295,u=d+(f<<4&4294967295|f>>>28),f=_+(u^d^p)+m[4]+1272893353&4294967295,_=u+(f<<11&4294967295|f>>>21),f=p+(_^u^d)+m[7]+4139469664&4294967295,p=_+(f<<16&4294967295|f>>>16),f=d+(p^_^u)+m[10]+3200236656&4294967295,d=p+(f<<23&4294967295|f>>>9),f=u+(d^p^_)+m[13]+681279174&4294967295,u=d+(f<<4&4294967295|f>>>28),f=_+(u^d^p)+m[0]+3936430074&4294967295,_=u+(f<<11&4294967295|f>>>21),f=p+(_^u^d)+m[3]+3572445317&4294967295,p=_+(f<<16&4294967295|f>>>16),f=d+(p^_^u)+m[6]+76029189&4294967295,d=p+(f<<23&4294967295|f>>>9),f=u+(d^p^_)+m[9]+3654602809&4294967295,u=d+(f<<4&4294967295|f>>>28),f=_+(u^d^p)+m[12]+3873151461&4294967295,_=u+(f<<11&4294967295|f>>>21),f=p+(_^u^d)+m[15]+530742520&4294967295,p=_+(f<<16&4294967295|f>>>16),f=d+(p^_^u)+m[2]+3299628645&4294967295,d=p+(f<<23&4294967295|f>>>9),f=u+(p^(d|~_))+m[0]+4096336452&4294967295,u=d+(f<<6&4294967295|f>>>26),f=_+(d^(u|~p))+m[7]+1126891415&4294967295,_=u+(f<<10&4294967295|f>>>22),f=p+(u^(_|~d))+m[14]+2878612391&4294967295,p=_+(f<<15&4294967295|f>>>17),f=d+(_^(p|~u))+m[5]+4237533241&4294967295,d=p+(f<<21&4294967295|f>>>11),f=u+(p^(d|~_))+m[12]+1700485571&4294967295,u=d+(f<<6&4294967295|f>>>26),f=_+(d^(u|~p))+m[3]+2399980690&4294967295,_=u+(f<<10&4294967295|f>>>22),f=p+(u^(_|~d))+m[10]+4293915773&4294967295,p=_+(f<<15&4294967295|f>>>17),f=d+(_^(p|~u))+m[1]+2240044497&4294967295,d=p+(f<<21&4294967295|f>>>11),f=u+(p^(d|~_))+m[8]+1873313359&4294967295,u=d+(f<<6&4294967295|f>>>26),f=_+(d^(u|~p))+m[15]+4264355552&4294967295,_=u+(f<<10&4294967295|f>>>22),f=p+(u^(_|~d))+m[6]+2734768916&4294967295,p=_+(f<<15&4294967295|f>>>17),f=d+(_^(p|~u))+m[13]+1309151649&4294967295,d=p+(f<<21&4294967295|f>>>11),f=u+(p^(d|~_))+m[4]+4149444226&4294967295,u=d+(f<<6&4294967295|f>>>26),f=_+(d^(u|~p))+m[11]+3174756917&4294967295,_=u+(f<<10&4294967295|f>>>22),f=p+(u^(_|~d))+m[2]+718787259&4294967295,p=_+(f<<15&4294967295|f>>>17),f=d+(_^(p|~u))+m[9]+3951481745&4294967295,g.g[0]=g.g[0]+u&4294967295,g.g[1]=g.g[1]+(p+(f<<21&4294967295|f>>>11))&4294967295,g.g[2]=g.g[2]+p&4294967295,g.g[3]=g.g[3]+_&4294967295}r.prototype.v=function(g,u){u===void 0&&(u=g.length);const d=u-this.blockSize,m=this.C;let p=this.h,_=0;for(;_<u;){if(p==0)for(;_<=d;)a(this,g,_),_+=this.blockSize;if(typeof g=="string"){for(;_<u;)if(m[p++]=g.charCodeAt(_++),p==this.blockSize){a(this,m),p=0;break}}else for(;_<u;)if(m[p++]=g[_++],p==this.blockSize){a(this,m),p=0;break}}this.h=p,this.o+=u},r.prototype.A=function(){var g=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);g[0]=128;for(var u=1;u<g.length-8;++u)g[u]=0;u=this.o*8;for(var d=g.length-8;d<g.length;++d)g[d]=u&255,u/=256;for(this.v(g),g=Array(16),u=0,d=0;d<4;++d)for(let m=0;m<32;m+=8)g[u++]=this.g[d]>>>m&255;return g};function h(g,u){var d=I;return Object.prototype.hasOwnProperty.call(d,g)?d[g]:d[g]=u(g)}function l(g,u){this.h=u;const d=[];let m=!0;for(let p=g.length-1;p>=0;p--){const _=g[p]|0;m&&_==u||(d[p]=_,m=!1)}this.g=d}var I={};function v(g){return-128<=g&&g<128?h(g,function(u){return new l([u|0],u<0?-1:0)}):new l([g|0],g<0?-1:0)}function T(g){if(isNaN(g)||!isFinite(g))return b;if(g<0)return L(T(-g));const u=[];let d=1;for(let m=0;g>=d;m++)u[m]=g/d|0,d*=4294967296;return new l(u,0)}function P(g,u){if(g.length==0)throw Error("number format error: empty string");if(u=u||10,u<2||36<u)throw Error("radix out of range: "+u);if(g.charAt(0)=="-")return L(P(g.substring(1),u));if(g.indexOf("-")>=0)throw Error('number format error: interior "-" character');const d=T(Math.pow(u,8));let m=b;for(let _=0;_<g.length;_+=8){var p=Math.min(8,g.length-_);const f=parseInt(g.substring(_,_+p),u);p<8?(p=T(Math.pow(u,p)),m=m.j(p).add(T(f))):(m=m.j(d),m=m.add(T(f)))}return m}var b=v(0),k=v(1),N=v(16777216);i=l.prototype,i.m=function(){if(U(this))return-L(this).m();let g=0,u=1;for(let d=0;d<this.g.length;d++){const m=this.i(d);g+=(m>=0?m:4294967296+m)*u,u*=4294967296}return g},i.toString=function(g){if(g=g||10,g<2||36<g)throw Error("radix out of range: "+g);if(D(this))return"0";if(U(this))return"-"+L(this).toString(g);const u=T(Math.pow(g,6));var d=this;let m="";for(;;){const p=xe(d,u).g;d=X(d,p.j(u));let _=((d.g.length>0?d.g[0]:d.h)>>>0).toString(g);if(d=p,D(d))return _+m;for(;_.length<6;)_="0"+_;m=_+m}},i.i=function(g){return g<0?0:g<this.g.length?this.g[g]:this.h};function D(g){if(g.h!=0)return!1;for(let u=0;u<g.g.length;u++)if(g.g[u]!=0)return!1;return!0}function U(g){return g.h==-1}i.l=function(g){return g=X(this,g),U(g)?-1:D(g)?0:1};function L(g){const u=g.g.length,d=[];for(let m=0;m<u;m++)d[m]=~g.g[m];return new l(d,~g.h).add(k)}i.abs=function(){return U(this)?L(this):this},i.add=function(g){const u=Math.max(this.g.length,g.g.length),d=[];let m=0;for(let p=0;p<=u;p++){let _=m+(this.i(p)&65535)+(g.i(p)&65535),f=(_>>>16)+(this.i(p)>>>16)+(g.i(p)>>>16);m=f>>>16,_&=65535,f&=65535,d[p]=f<<16|_}return new l(d,d[d.length-1]&-2147483648?-1:0)};function X(g,u){return g.add(L(u))}i.j=function(g){if(D(this)||D(g))return b;if(U(this))return U(g)?L(this).j(L(g)):L(L(this).j(g));if(U(g))return L(this.j(L(g)));if(this.l(N)<0&&g.l(N)<0)return T(this.m()*g.m());const u=this.g.length+g.g.length,d=[];for(var m=0;m<2*u;m++)d[m]=0;for(m=0;m<this.g.length;m++)for(let p=0;p<g.g.length;p++){const _=this.i(m)>>>16,f=this.i(m)&65535,V=g.i(p)>>>16,Ae=g.i(p)&65535;d[2*m+2*p]+=f*Ae,ae(d,2*m+2*p),d[2*m+2*p+1]+=_*Ae,ae(d,2*m+2*p+1),d[2*m+2*p+1]+=f*V,ae(d,2*m+2*p+1),d[2*m+2*p+2]+=_*V,ae(d,2*m+2*p+2)}for(g=0;g<u;g++)d[g]=d[2*g+1]<<16|d[2*g];for(g=u;g<2*u;g++)d[g]=0;return new l(d,0)};function ae(g,u){for(;(g[u]&65535)!=g[u];)g[u+1]+=g[u]>>>16,g[u]&=65535,u++}function ce(g,u){this.g=g,this.h=u}function xe(g,u){if(D(u))throw Error("division by zero");if(D(g))return new ce(b,b);if(U(g))return u=xe(L(g),u),new ce(L(u.g),L(u.h));if(U(u))return u=xe(g,L(u)),new ce(L(u.g),u.h);if(g.g.length>30){if(U(g)||U(u))throw Error("slowDivide_ only works with positive integers.");for(var d=k,m=u;m.l(g)<=0;)d=he(d),m=he(m);var p=z(d,1),_=z(m,1);for(m=z(m,2),d=z(d,2);!D(m);){var f=_.add(m);f.l(g)<=0&&(p=p.add(d),_=f),m=z(m,1),d=z(d,1)}return u=X(g,p.j(u)),new ce(p,u)}for(p=b;g.l(u)>=0;){for(d=Math.max(1,Math.floor(g.m()/u.m())),m=Math.ceil(Math.log(d)/Math.LN2),m=m<=48?1:Math.pow(2,m-48),_=T(d),f=_.j(u);U(f)||f.l(g)>0;)d-=m,_=T(d),f=_.j(u);D(_)&&(_=k),p=p.add(_),g=X(g,f)}return new ce(p,g)}i.B=function(g){return xe(this,g).h},i.and=function(g){const u=Math.max(this.g.length,g.g.length),d=[];for(let m=0;m<u;m++)d[m]=this.i(m)&g.i(m);return new l(d,this.h&g.h)},i.or=function(g){const u=Math.max(this.g.length,g.g.length),d=[];for(let m=0;m<u;m++)d[m]=this.i(m)|g.i(m);return new l(d,this.h|g.h)},i.xor=function(g){const u=Math.max(this.g.length,g.g.length),d=[];for(let m=0;m<u;m++)d[m]=this.i(m)^g.i(m);return new l(d,this.h^g.h)};function he(g){const u=g.g.length+1,d=[];for(let m=0;m<u;m++)d[m]=g.i(m)<<1|g.i(m-1)>>>31;return new l(d,g.h)}function z(g,u){const d=u>>5;u%=32;const m=g.g.length-d,p=[];for(let _=0;_<m;_++)p[_]=u>0?g.i(_+d)>>>u|g.i(_+d+1)<<32-u:g.i(_+d);return new l(p,g.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,ec=r,l.prototype.add=l.prototype.add,l.prototype.multiply=l.prototype.j,l.prototype.modulo=l.prototype.B,l.prototype.compare=l.prototype.l,l.prototype.toNumber=l.prototype.m,l.prototype.toString=l.prototype.toString,l.prototype.getBits=l.prototype.i,l.fromNumber=T,l.fromString=P,Za=l}).apply(typeof Ir<"u"?Ir:typeof self<"u"?self:typeof window<"u"?window:{});var xt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var tc,nc,ic,rc,sc,oc,ac,cc;(function(){var i,e=Object.defineProperty;function n(t){t=[typeof globalThis=="object"&&globalThis,t,typeof window=="object"&&window,typeof self=="object"&&self,typeof xt=="object"&&xt];for(var s=0;s<t.length;++s){var o=t[s];if(o&&o.Math==Math)return o}throw Error("Cannot find global object")}var r=n(this);function a(t,s){if(s)e:{var o=r;t=t.split(".");for(var c=0;c<t.length-1;c++){var y=t[c];if(!(y in o))break e;o=o[y]}t=t[t.length-1],c=o[t],s=s(c),s!=c&&s!=null&&e(o,t,{configurable:!0,writable:!0,value:s})}}a("Symbol.dispose",function(t){return t||Symbol("Symbol.dispose")}),a("Array.prototype.values",function(t){return t||function(){return this[Symbol.iterator]()}}),a("Object.entries",function(t){return t||function(s){var o=[],c;for(c in s)Object.prototype.hasOwnProperty.call(s,c)&&o.push([c,s[c]]);return o}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var h=h||{},l=this||self;function I(t){var s=typeof t;return s=="object"&&t!=null||s=="function"}function v(t,s,o){return t.call.apply(t.bind,arguments)}function T(t,s,o){return T=v,T.apply(null,arguments)}function P(t,s){var o=Array.prototype.slice.call(arguments,1);return function(){var c=o.slice();return c.push.apply(c,arguments),t.apply(this,c)}}function b(t,s){function o(){}o.prototype=s.prototype,t.Z=s.prototype,t.prototype=new o,t.prototype.constructor=t,t.Ob=function(c,y,w){for(var E=Array(arguments.length-2),A=2;A<arguments.length;A++)E[A-2]=arguments[A];return s.prototype[y].apply(c,E)}}var k=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?t=>t&&AsyncContext.Snapshot.wrap(t):t=>t;function N(t){const s=t.length;if(s>0){const o=Array(s);for(let c=0;c<s;c++)o[c]=t[c];return o}return[]}function D(t,s){for(let c=1;c<arguments.length;c++){const y=arguments[c];var o=typeof y;if(o=o!="object"?o:y?Array.isArray(y)?"array":o:"null",o=="array"||o=="object"&&typeof y.length=="number"){o=t.length||0;const w=y.length||0;t.length=o+w;for(let E=0;E<w;E++)t[o+E]=y[E]}else t.push(y)}}class U{constructor(s,o){this.i=s,this.j=o,this.h=0,this.g=null}get(){let s;return this.h>0?(this.h--,s=this.g,this.g=s.next,s.next=null):s=this.i(),s}}function L(t){l.setTimeout(()=>{throw t},0)}function X(){var t=g;let s=null;return t.g&&(s=t.g,t.g=t.g.next,t.g||(t.h=null),s.next=null),s}class ae{constructor(){this.h=this.g=null}add(s,o){const c=ce.get();c.set(s,o),this.h?this.h.next=c:this.g=c,this.h=c}}var ce=new U(()=>new xe,t=>t.reset());class xe{constructor(){this.next=this.g=this.h=null}set(s,o){this.h=s,this.g=o,this.next=null}reset(){this.next=this.g=this.h=null}}let he,z=!1,g=new ae,u=()=>{const t=Promise.resolve(void 0);he=()=>{t.then(d)}};function d(){for(var t;t=X();){try{t.h.call(t.g)}catch(o){L(o)}var s=ce;s.j(t),s.h<100&&(s.h++,t.next=s.g,s.g=t)}z=!1}function m(){this.u=this.u,this.C=this.C}m.prototype.u=!1,m.prototype.dispose=function(){this.u||(this.u=!0,this.N())},m.prototype[Symbol.dispose]=function(){this.dispose()},m.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function p(t,s){this.type=t,this.g=this.target=s,this.defaultPrevented=!1}p.prototype.h=function(){this.defaultPrevented=!0};var _=function(){if(!l.addEventListener||!Object.defineProperty)return!1;var t=!1,s=Object.defineProperty({},"passive",{get:function(){t=!0}});try{const o=()=>{};l.addEventListener("test",o,s),l.removeEventListener("test",o,s)}catch{}return t}();function f(t){return/^[\s\xa0]*$/.test(t)}function V(t,s){p.call(this,t?t.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,t&&this.init(t,s)}b(V,p),V.prototype.init=function(t,s){const o=this.type=t.type,c=t.changedTouches&&t.changedTouches.length?t.changedTouches[0]:null;this.target=t.target||t.srcElement,this.g=s,s=t.relatedTarget,s||(o=="mouseover"?s=t.fromElement:o=="mouseout"&&(s=t.toElement)),this.relatedTarget=s,c?(this.clientX=c.clientX!==void 0?c.clientX:c.pageX,this.clientY=c.clientY!==void 0?c.clientY:c.pageY,this.screenX=c.screenX||0,this.screenY=c.screenY||0):(this.clientX=t.clientX!==void 0?t.clientX:t.pageX,this.clientY=t.clientY!==void 0?t.clientY:t.pageY,this.screenX=t.screenX||0,this.screenY=t.screenY||0),this.button=t.button,this.key=t.key||"",this.ctrlKey=t.ctrlKey,this.altKey=t.altKey,this.shiftKey=t.shiftKey,this.metaKey=t.metaKey,this.pointerId=t.pointerId||0,this.pointerType=t.pointerType,this.state=t.state,this.i=t,t.defaultPrevented&&V.Z.h.call(this)},V.prototype.h=function(){V.Z.h.call(this);const t=this.i;t.preventDefault?t.preventDefault():t.returnValue=!1};var Ae="closure_listenable_"+(Math.random()*1e6|0),Fs=0;function js(t,s,o,c,y){this.listener=t,this.proxy=null,this.src=s,this.type=o,this.capture=!!c,this.ha=y,this.key=++Fs,this.da=this.fa=!1}function It(t){t.da=!0,t.listener=null,t.proxy=null,t.src=null,t.ha=null}function Tt(t,s,o){for(const c in t)s.call(o,t[c],c,t)}function Hs(t,s){for(const o in t)s.call(void 0,t[o],o,t)}function li(t){const s={};for(const o in t)s[o]=t[o];return s}const ui="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function fi(t,s){let o,c;for(let y=1;y<arguments.length;y++){c=arguments[y];for(o in c)t[o]=c[o];for(let w=0;w<ui.length;w++)o=ui[w],Object.prototype.hasOwnProperty.call(c,o)&&(t[o]=c[o])}}function Et(t){this.src=t,this.g={},this.h=0}Et.prototype.add=function(t,s,o,c,y){const w=t.toString();t=this.g[w],t||(t=this.g[w]=[],this.h++);const E=hn(t,s,c,y);return E>-1?(s=t[E],o||(s.fa=!1)):(s=new js(s,this.src,w,!!c,y),s.fa=o,t.push(s)),s};function cn(t,s){const o=s.type;if(o in t.g){var c=t.g[o],y=Array.prototype.indexOf.call(c,s,void 0),w;(w=y>=0)&&Array.prototype.splice.call(c,y,1),w&&(It(s),t.g[o].length==0&&(delete t.g[o],t.h--))}}function hn(t,s,o,c){for(let y=0;y<t.length;++y){const w=t[y];if(!w.da&&w.listener==s&&w.capture==!!o&&w.ha==c)return y}return-1}var ln="closure_lm_"+(Math.random()*1e6|0),un={};function di(t,s,o,c,y){if(Array.isArray(s)){for(let w=0;w<s.length;w++)di(t,s[w],o,c,y);return null}return o=mi(o),t&&t[Ae]?t.J(s,o,I(c)?!!c.capture:!1,y):$s(t,s,o,!1,c,y)}function $s(t,s,o,c,y,w){if(!s)throw Error("Invalid event type");const E=I(y)?!!y.capture:!!y;let A=dn(t);if(A||(t[ln]=A=new Et(t)),o=A.add(s,o,c,E,w),o.proxy)return o;if(c=Vs(),o.proxy=c,c.src=t,c.listener=o,t.addEventListener)_||(y=E),y===void 0&&(y=!1),t.addEventListener(s.toString(),c,y);else if(t.attachEvent)t.attachEvent(gi(s.toString()),c);else if(t.addListener&&t.removeListener)t.addListener(c);else throw Error("addEventListener and attachEvent are unavailable.");return o}function Vs(){function t(o){return s.call(t.src,t.listener,o)}const s=Ws;return t}function pi(t,s,o,c,y){if(Array.isArray(s))for(var w=0;w<s.length;w++)pi(t,s[w],o,c,y);else c=I(c)?!!c.capture:!!c,o=mi(o),t&&t[Ae]?(t=t.i,w=String(s).toString(),w in t.g&&(s=t.g[w],o=hn(s,o,c,y),o>-1&&(It(s[o]),Array.prototype.splice.call(s,o,1),s.length==0&&(delete t.g[w],t.h--)))):t&&(t=dn(t))&&(s=t.g[s.toString()],t=-1,s&&(t=hn(s,o,c,y)),(o=t>-1?s[t]:null)&&fn(o))}function fn(t){if(typeof t!="number"&&t&&!t.da){var s=t.src;if(s&&s[Ae])cn(s.i,t);else{var o=t.type,c=t.proxy;s.removeEventListener?s.removeEventListener(o,c,t.capture):s.detachEvent?s.detachEvent(gi(o),c):s.addListener&&s.removeListener&&s.removeListener(c),(o=dn(s))?(cn(o,t),o.h==0&&(o.src=null,s[ln]=null)):It(t)}}}function gi(t){return t in un?un[t]:un[t]="on"+t}function Ws(t,s){if(t.da)t=!0;else{s=new V(s,this);const o=t.listener,c=t.ha||t.src;t.fa&&fn(t),t=o.call(c,s)}return t}function dn(t){return t=t[ln],t instanceof Et?t:null}var pn="__closure_events_fn_"+(Math.random()*1e9>>>0);function mi(t){return typeof t=="function"?t:(t[pn]||(t[pn]=function(s){return t.handleEvent(s)}),t[pn])}function F(){m.call(this),this.i=new Et(this),this.M=this,this.G=null}b(F,m),F.prototype[Ae]=!0,F.prototype.removeEventListener=function(t,s,o,c){pi(this,t,s,o,c)};function j(t,s){var o,c=t.G;if(c)for(o=[];c;c=c.G)o.push(c);if(t=t.M,c=s.type||s,typeof s=="string")s=new p(s,t);else if(s instanceof p)s.target=s.target||t;else{var y=s;s=new p(c,t),fi(s,y)}y=!0;let w,E;if(o)for(E=o.length-1;E>=0;E--)w=s.g=o[E],y=bt(w,c,!0,s)&&y;if(w=s.g=t,y=bt(w,c,!0,s)&&y,y=bt(w,c,!1,s)&&y,o)for(E=0;E<o.length;E++)w=s.g=o[E],y=bt(w,c,!1,s)&&y}F.prototype.N=function(){if(F.Z.N.call(this),this.i){var t=this.i;for(const s in t.g){const o=t.g[s];for(let c=0;c<o.length;c++)It(o[c]);delete t.g[s],t.h--}}this.G=null},F.prototype.J=function(t,s,o,c){return this.i.add(String(t),s,!1,o,c)},F.prototype.K=function(t,s,o,c){return this.i.add(String(t),s,!0,o,c)};function bt(t,s,o,c){if(s=t.i.g[String(s)],!s)return!0;s=s.concat();let y=!0;for(let w=0;w<s.length;++w){const E=s[w];if(E&&!E.da&&E.capture==o){const A=E.listener,x=E.ha||E.src;E.fa&&cn(t.i,E),y=A.call(x,c)!==!1&&y}}return y&&!c.defaultPrevented}function zs(t,s){if(typeof t!="function")if(t&&typeof t.handleEvent=="function")t=T(t.handleEvent,t);else throw Error("Invalid listener argument");return Number(s)>2147483647?-1:l.setTimeout(t,s||0)}function yi(t){t.g=zs(()=>{t.g=null,t.i&&(t.i=!1,yi(t))},t.l);const s=t.h;t.h=null,t.m.apply(null,s)}class Gs extends m{constructor(s,o){super(),this.m=s,this.l=o,this.h=null,this.i=!1,this.g=null}j(s){this.h=arguments,this.g?this.i=!0:yi(this)}N(){super.N(),this.g&&(l.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Ke(t){m.call(this),this.h=t,this.g={}}b(Ke,m);var _i=[];function wi(t){Tt(t.g,function(s,o){this.g.hasOwnProperty(o)&&fn(s)},t),t.g={}}Ke.prototype.N=function(){Ke.Z.N.call(this),wi(this)},Ke.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var gn=l.JSON.stringify,Ks=l.JSON.parse,qs=class{stringify(t){return l.JSON.stringify(t,void 0)}parse(t){return l.JSON.parse(t,void 0)}};function vi(){}function Ii(){}var qe={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function mn(){p.call(this,"d")}b(mn,p);function yn(){p.call(this,"c")}b(yn,p);var Pe={},Ti=null;function St(){return Ti=Ti||new F}Pe.Ia="serverreachability";function Ei(t){p.call(this,Pe.Ia,t)}b(Ei,p);function Je(t){const s=St();j(s,new Ei(s))}Pe.STAT_EVENT="statevent";function bi(t,s){p.call(this,Pe.STAT_EVENT,t),this.stat=s}b(bi,p);function H(t){const s=St();j(s,new bi(s,t))}Pe.Ja="timingevent";function Si(t,s){p.call(this,Pe.Ja,t),this.size=s}b(Si,p);function Xe(t,s){if(typeof t!="function")throw Error("Fn must not be null and must be a function");return l.setTimeout(function(){t()},s)}function Ye(){this.g=!0}Ye.prototype.ua=function(){this.g=!1};function Js(t,s,o,c,y,w){t.info(function(){if(t.g)if(w){var E="",A=w.split("&");for(let C=0;C<A.length;C++){var x=A[C].split("=");if(x.length>1){const B=x[0];x=x[1];const Q=B.split("_");E=Q.length>=2&&Q[1]=="type"?E+(B+"="+x+"&"):E+(B+"=redacted&")}}}else E=null;else E=w;return"XMLHTTP REQ ("+c+") [attempt "+y+"]: "+s+`
`+o+`
`+E})}function Xs(t,s,o,c,y,w,E){t.info(function(){return"XMLHTTP RESP ("+c+") [ attempt "+y+"]: "+s+`
`+o+`
`+w+" "+E})}function Be(t,s,o,c){t.info(function(){return"XMLHTTP TEXT ("+s+"): "+Qs(t,o)+(c?" "+c:"")})}function Ys(t,s){t.info(function(){return"TIMEOUT: "+s})}Ye.prototype.info=function(){};function Qs(t,s){if(!t.g)return s;if(!s)return null;try{const w=JSON.parse(s);if(w){for(t=0;t<w.length;t++)if(Array.isArray(w[t])){var o=w[t];if(!(o.length<2)){var c=o[1];if(Array.isArray(c)&&!(c.length<1)){var y=c[0];if(y!="noop"&&y!="stop"&&y!="close")for(let E=1;E<c.length;E++)c[E]=""}}}}return gn(w)}catch{return s}}var At={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Ai={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},Pi;function _n(){}b(_n,vi),_n.prototype.g=function(){return new XMLHttpRequest},Pi=new _n;function Qe(t){return encodeURIComponent(String(t))}function Zs(t){var s=1;t=t.split(":");const o=[];for(;s>0&&t.length;)o.push(t.shift()),s--;return t.length&&o.push(t.join(":")),o}function le(t,s,o,c){this.j=t,this.i=s,this.l=o,this.S=c||1,this.V=new Ke(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new ki}function ki(){this.i=null,this.g="",this.h=!1}var Ci={},wn={};function vn(t,s,o){t.M=1,t.A=kt(Y(s)),t.u=o,t.R=!0,Ri(t,null)}function Ri(t,s){t.F=Date.now(),Pt(t),t.B=Y(t.A);var o=t.B,c=t.S;Array.isArray(c)||(c=[String(c)]),Vi(o.i,"t",c),t.C=0,o=t.j.L,t.h=new ki,t.g=ar(t.j,o?s:null,!t.u),t.P>0&&(t.O=new Gs(T(t.Y,t,t.g),t.P)),s=t.V,o=t.g,c=t.ba;var y="readystatechange";Array.isArray(y)||(y&&(_i[0]=y.toString()),y=_i);for(let w=0;w<y.length;w++){const E=di(o,y[w],c||s.handleEvent,!1,s.h||s);if(!E)break;s.g[E.key]=E}s=t.J?li(t.J):{},t.u?(t.v||(t.v="POST"),s["Content-Type"]="application/x-www-form-urlencoded",t.g.ea(t.B,t.v,t.u,s)):(t.v="GET",t.g.ea(t.B,t.v,null,s)),Je(),Js(t.i,t.v,t.B,t.l,t.S,t.u)}le.prototype.ba=function(t){t=t.target;const s=this.O;s&&de(t)==3?s.j():this.Y(t)},le.prototype.Y=function(t){try{if(t==this.g)e:{const A=de(this.g),x=this.g.ya(),C=this.g.ca();if(!(A<3)&&(A!=3||this.g&&(this.h.h||this.g.la()||Xi(this.g)))){this.K||A!=4||x==7||(x==8||C<=0?Je(3):Je(2)),In(this);var s=this.g.ca();this.X=s;var o=eo(this);if(this.o=s==200,Xs(this.i,this.v,this.B,this.l,this.S,A,s),this.o){if(this.U&&!this.L){t:{if(this.g){var c,y=this.g;if((c=y.g?y.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!f(c)){var w=c;break t}}w=null}if(t=w)Be(this.i,this.l,t,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Tn(this,t);else{this.o=!1,this.m=3,H(12),ke(this),Ze(this);break e}}if(this.R){t=!0;let B;for(;!this.K&&this.C<o.length;)if(B=to(this,o),B==wn){A==4&&(this.m=4,H(14),t=!1),Be(this.i,this.l,null,"[Incomplete Response]");break}else if(B==Ci){this.m=4,H(15),Be(this.i,this.l,o,"[Invalid Chunk]"),t=!1;break}else Be(this.i,this.l,B,null),Tn(this,B);if(Oi(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),A!=4||o.length!=0||this.h.h||(this.m=1,H(16),t=!1),this.o=this.o&&t,!t)Be(this.i,this.l,o,"[Invalid Chunked Response]"),ke(this),Ze(this);else if(o.length>0&&!this.W){this.W=!0;var E=this.j;E.g==this&&E.aa&&!E.P&&(E.j.info("Great, no buffering proxy detected. Bytes received: "+o.length),Rn(E),E.P=!0,H(11))}}else Be(this.i,this.l,o,null),Tn(this,o);A==4&&ke(this),this.o&&!this.K&&(A==4?ir(this.j,this):(this.o=!1,Pt(this)))}else mo(this.g),s==400&&o.indexOf("Unknown SID")>0?(this.m=3,H(12)):(this.m=0,H(13)),ke(this),Ze(this)}}}catch{}finally{}};function eo(t){if(!Oi(t))return t.g.la();const s=Xi(t.g);if(s==="")return"";let o="";const c=s.length,y=de(t.g)==4;if(!t.h.i){if(typeof TextDecoder>"u")return ke(t),Ze(t),"";t.h.i=new l.TextDecoder}for(let w=0;w<c;w++)t.h.h=!0,o+=t.h.i.decode(s[w],{stream:!(y&&w==c-1)});return s.length=0,t.h.g+=o,t.C=0,t.h.g}function Oi(t){return t.g?t.v=="GET"&&t.M!=2&&t.j.Aa:!1}function to(t,s){var o=t.C,c=s.indexOf(`
`,o);return c==-1?wn:(o=Number(s.substring(o,c)),isNaN(o)?Ci:(c+=1,c+o>s.length?wn:(s=s.slice(c,c+o),t.C=c+o,s)))}le.prototype.cancel=function(){this.K=!0,ke(this)};function Pt(t){t.T=Date.now()+t.H,Di(t,t.H)}function Di(t,s){if(t.D!=null)throw Error("WatchDog timer not null");t.D=Xe(T(t.aa,t),s)}function In(t){t.D&&(l.clearTimeout(t.D),t.D=null)}le.prototype.aa=function(){this.D=null;const t=Date.now();t-this.T>=0?(Ys(this.i,this.B),this.M!=2&&(Je(),H(17)),ke(this),this.m=2,Ze(this)):Di(this,this.T-t)};function Ze(t){t.j.I==0||t.K||ir(t.j,t)}function ke(t){In(t);var s=t.O;s&&typeof s.dispose=="function"&&s.dispose(),t.O=null,wi(t.V),t.g&&(s=t.g,t.g=null,s.abort(),s.dispose())}function Tn(t,s){try{var o=t.j;if(o.I!=0&&(o.g==t||En(o.h,t))){if(!t.L&&En(o.h,t)&&o.I==3){try{var c=o.Ba.g.parse(s)}catch{c=null}if(Array.isArray(c)&&c.length==3){var y=c;if(y[0]==0){e:if(!o.v){if(o.g)if(o.g.F+3e3<t.F)Nt(o),Ot(o);else break e;Cn(o),H(18)}}else o.xa=y[1],0<o.xa-o.K&&y[2]<37500&&o.F&&o.A==0&&!o.C&&(o.C=Xe(T(o.Va,o),6e3));Li(o.h)<=1&&o.ta&&(o.ta=void 0)}else Re(o,11)}else if((t.L||o.g==t)&&Nt(o),!f(s))for(y=o.Ba.g.parse(s),s=0;s<y.length;s++){let C=y[s];const B=C[0];if(!(B<=o.K))if(o.K=B,C=C[1],o.I==2)if(C[0]=="c"){o.M=C[1],o.ba=C[2];const Q=C[3];Q!=null&&(o.ka=Q,o.j.info("VER="+o.ka));const Oe=C[4];Oe!=null&&(o.za=Oe,o.j.info("SVER="+o.za));const pe=C[5];pe!=null&&typeof pe=="number"&&pe>0&&(c=1.5*pe,o.O=c,o.j.info("backChannelRequestTimeoutMs_="+c)),c=o;const ge=t.g;if(ge){const Lt=ge.g?ge.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Lt){var w=c.h;w.g||Lt.indexOf("spdy")==-1&&Lt.indexOf("quic")==-1&&Lt.indexOf("h2")==-1||(w.j=w.l,w.g=new Set,w.h&&(bn(w,w.h),w.h=null))}if(c.G){const On=ge.g?ge.g.getResponseHeader("X-HTTP-Session-Id"):null;On&&(c.wa=On,O(c.J,c.G,On))}}o.I=3,o.l&&o.l.ra(),o.aa&&(o.T=Date.now()-t.F,o.j.info("Handshake RTT: "+o.T+"ms")),c=o;var E=t;if(c.na=or(c,c.L?c.ba:null,c.W),E.L){Ui(c.h,E);var A=E,x=c.O;x&&(A.H=x),A.D&&(In(A),Pt(A)),c.g=E}else tr(c);o.i.length>0&&Dt(o)}else C[0]!="stop"&&C[0]!="close"||Re(o,7);else o.I==3&&(C[0]=="stop"||C[0]=="close"?C[0]=="stop"?Re(o,7):kn(o):C[0]!="noop"&&o.l&&o.l.qa(C),o.A=0)}}Je(4)}catch{}}var no=class{constructor(t,s){this.g=t,this.map=s}};function Ni(t){this.l=t||10,l.PerformanceNavigationTiming?(t=l.performance.getEntriesByType("navigation"),t=t.length>0&&(t[0].nextHopProtocol=="hq"||t[0].nextHopProtocol=="h2")):t=!!(l.chrome&&l.chrome.loadTimes&&l.chrome.loadTimes()&&l.chrome.loadTimes().wasFetchedViaSpdy),this.j=t?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Mi(t){return t.h?!0:t.g?t.g.size>=t.j:!1}function Li(t){return t.h?1:t.g?t.g.size:0}function En(t,s){return t.h?t.h==s:t.g?t.g.has(s):!1}function bn(t,s){t.g?t.g.add(s):t.h=s}function Ui(t,s){t.h&&t.h==s?t.h=null:t.g&&t.g.has(s)&&t.g.delete(s)}Ni.prototype.cancel=function(){if(this.i=xi(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const t of this.g.values())t.cancel();this.g.clear()}};function xi(t){if(t.h!=null)return t.i.concat(t.h.G);if(t.g!=null&&t.g.size!==0){let s=t.i;for(const o of t.g.values())s=s.concat(o.G);return s}return N(t.i)}var Bi=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function io(t,s){if(t){t=t.split("&");for(let o=0;o<t.length;o++){const c=t[o].indexOf("=");let y,w=null;c>=0?(y=t[o].substring(0,c),w=t[o].substring(c+1)):y=t[o],s(y,w?decodeURIComponent(w.replace(/\+/g," ")):"")}}}function ue(t){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let s;t instanceof ue?(this.l=t.l,et(this,t.j),this.o=t.o,this.g=t.g,tt(this,t.u),this.h=t.h,Sn(this,Wi(t.i)),this.m=t.m):t&&(s=String(t).match(Bi))?(this.l=!1,et(this,s[1]||"",!0),this.o=nt(s[2]||""),this.g=nt(s[3]||"",!0),tt(this,s[4]),this.h=nt(s[5]||"",!0),Sn(this,s[6]||"",!0),this.m=nt(s[7]||"")):(this.l=!1,this.i=new rt(null,this.l))}ue.prototype.toString=function(){const t=[];var s=this.j;s&&t.push(it(s,Fi,!0),":");var o=this.g;return(o||s=="file")&&(t.push("//"),(s=this.o)&&t.push(it(s,Fi,!0),"@"),t.push(Qe(o).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),o=this.u,o!=null&&t.push(":",String(o))),(o=this.h)&&(this.g&&o.charAt(0)!="/"&&t.push("/"),t.push(it(o,o.charAt(0)=="/"?oo:so,!0))),(o=this.i.toString())&&t.push("?",o),(o=this.m)&&t.push("#",it(o,co)),t.join("")},ue.prototype.resolve=function(t){const s=Y(this);let o=!!t.j;o?et(s,t.j):o=!!t.o,o?s.o=t.o:o=!!t.g,o?s.g=t.g:o=t.u!=null;var c=t.h;if(o)tt(s,t.u);else if(o=!!t.h){if(c.charAt(0)!="/")if(this.g&&!this.h)c="/"+c;else{var y=s.h.lastIndexOf("/");y!=-1&&(c=s.h.slice(0,y+1)+c)}if(y=c,y==".."||y==".")c="";else if(y.indexOf("./")!=-1||y.indexOf("/.")!=-1){c=y.lastIndexOf("/",0)==0,y=y.split("/");const w=[];for(let E=0;E<y.length;){const A=y[E++];A=="."?c&&E==y.length&&w.push(""):A==".."?((w.length>1||w.length==1&&w[0]!="")&&w.pop(),c&&E==y.length&&w.push("")):(w.push(A),c=!0)}c=w.join("/")}else c=y}return o?s.h=c:o=t.i.toString()!=="",o?Sn(s,Wi(t.i)):o=!!t.m,o&&(s.m=t.m),s};function Y(t){return new ue(t)}function et(t,s,o){t.j=o?nt(s,!0):s,t.j&&(t.j=t.j.replace(/:$/,""))}function tt(t,s){if(s){if(s=Number(s),isNaN(s)||s<0)throw Error("Bad port number "+s);t.u=s}else t.u=null}function Sn(t,s,o){s instanceof rt?(t.i=s,ho(t.i,t.l)):(o||(s=it(s,ao)),t.i=new rt(s,t.l))}function O(t,s,o){t.i.set(s,o)}function kt(t){return O(t,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),t}function nt(t,s){return t?s?decodeURI(t.replace(/%25/g,"%2525")):decodeURIComponent(t):""}function it(t,s,o){return typeof t=="string"?(t=encodeURI(t).replace(s,ro),o&&(t=t.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),t):null}function ro(t){return t=t.charCodeAt(0),"%"+(t>>4&15).toString(16)+(t&15).toString(16)}var Fi=/[#\/\?@]/g,so=/[#\?:]/g,oo=/[#\?]/g,ao=/[#\?@]/g,co=/#/g;function rt(t,s){this.h=this.g=null,this.i=t||null,this.j=!!s}function Ce(t){t.g||(t.g=new Map,t.h=0,t.i&&io(t.i,function(s,o){t.add(decodeURIComponent(s.replace(/\+/g," ")),o)}))}i=rt.prototype,i.add=function(t,s){Ce(this),this.i=null,t=Fe(this,t);let o=this.g.get(t);return o||this.g.set(t,o=[]),o.push(s),this.h+=1,this};function ji(t,s){Ce(t),s=Fe(t,s),t.g.has(s)&&(t.i=null,t.h-=t.g.get(s).length,t.g.delete(s))}function Hi(t,s){return Ce(t),s=Fe(t,s),t.g.has(s)}i.forEach=function(t,s){Ce(this),this.g.forEach(function(o,c){o.forEach(function(y){t.call(s,y,c,this)},this)},this)};function $i(t,s){Ce(t);let o=[];if(typeof s=="string")Hi(t,s)&&(o=o.concat(t.g.get(Fe(t,s))));else for(t=Array.from(t.g.values()),s=0;s<t.length;s++)o=o.concat(t[s]);return o}i.set=function(t,s){return Ce(this),this.i=null,t=Fe(this,t),Hi(this,t)&&(this.h-=this.g.get(t).length),this.g.set(t,[s]),this.h+=1,this},i.get=function(t,s){return t?(t=$i(this,t),t.length>0?String(t[0]):s):s};function Vi(t,s,o){ji(t,s),o.length>0&&(t.i=null,t.g.set(Fe(t,s),N(o)),t.h+=o.length)}i.toString=function(){if(this.i)return this.i;if(!this.g)return"";const t=[],s=Array.from(this.g.keys());for(let c=0;c<s.length;c++){var o=s[c];const y=Qe(o);o=$i(this,o);for(let w=0;w<o.length;w++){let E=y;o[w]!==""&&(E+="="+Qe(o[w])),t.push(E)}}return this.i=t.join("&")};function Wi(t){const s=new rt;return s.i=t.i,t.g&&(s.g=new Map(t.g),s.h=t.h),s}function Fe(t,s){return s=String(s),t.j&&(s=s.toLowerCase()),s}function ho(t,s){s&&!t.j&&(Ce(t),t.i=null,t.g.forEach(function(o,c){const y=c.toLowerCase();c!=y&&(ji(this,c),Vi(this,y,o))},t)),t.j=s}function lo(t,s){const o=new Ye;if(l.Image){const c=new Image;c.onload=P(fe,o,"TestLoadImage: loaded",!0,s,c),c.onerror=P(fe,o,"TestLoadImage: error",!1,s,c),c.onabort=P(fe,o,"TestLoadImage: abort",!1,s,c),c.ontimeout=P(fe,o,"TestLoadImage: timeout",!1,s,c),l.setTimeout(function(){c.ontimeout&&c.ontimeout()},1e4),c.src=t}else s(!1)}function uo(t,s){const o=new Ye,c=new AbortController,y=setTimeout(()=>{c.abort(),fe(o,"TestPingServer: timeout",!1,s)},1e4);fetch(t,{signal:c.signal}).then(w=>{clearTimeout(y),w.ok?fe(o,"TestPingServer: ok",!0,s):fe(o,"TestPingServer: server error",!1,s)}).catch(()=>{clearTimeout(y),fe(o,"TestPingServer: error",!1,s)})}function fe(t,s,o,c,y){try{y&&(y.onload=null,y.onerror=null,y.onabort=null,y.ontimeout=null),c(o)}catch{}}function fo(){this.g=new qs}function An(t){this.i=t.Sb||null,this.h=t.ab||!1}b(An,vi),An.prototype.g=function(){return new Ct(this.i,this.h)};function Ct(t,s){F.call(this),this.H=t,this.o=s,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}b(Ct,F),i=Ct.prototype,i.open=function(t,s){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=t,this.D=s,this.readyState=1,ot(this)},i.send=function(t){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const s={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};t&&(s.body=t),(this.H||l).fetch(new Request(this.D,s)).then(this.Pa.bind(this),this.ga.bind(this))},i.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,st(this)),this.readyState=0},i.Pa=function(t){if(this.g&&(this.l=t,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=t.headers,this.readyState=2,ot(this)),this.g&&(this.readyState=3,ot(this),this.g)))if(this.responseType==="arraybuffer")t.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof l.ReadableStream<"u"&&"body"in t){if(this.j=t.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;zi(this)}else t.text().then(this.Oa.bind(this),this.ga.bind(this))};function zi(t){t.j.read().then(t.Ma.bind(t)).catch(t.ga.bind(t))}i.Ma=function(t){if(this.g){if(this.o&&t.value)this.response.push(t.value);else if(!this.o){var s=t.value?t.value:new Uint8Array(0);(s=this.B.decode(s,{stream:!t.done}))&&(this.response=this.responseText+=s)}t.done?st(this):ot(this),this.readyState==3&&zi(this)}},i.Oa=function(t){this.g&&(this.response=this.responseText=t,st(this))},i.Na=function(t){this.g&&(this.response=t,st(this))},i.ga=function(){this.g&&st(this)};function st(t){t.readyState=4,t.l=null,t.j=null,t.B=null,ot(t)}i.setRequestHeader=function(t,s){this.A.append(t,s)},i.getResponseHeader=function(t){return this.h&&this.h.get(t.toLowerCase())||""},i.getAllResponseHeaders=function(){if(!this.h)return"";const t=[],s=this.h.entries();for(var o=s.next();!o.done;)o=o.value,t.push(o[0]+": "+o[1]),o=s.next();return t.join(`\r
`)};function ot(t){t.onreadystatechange&&t.onreadystatechange.call(t)}Object.defineProperty(Ct.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(t){this.m=t?"include":"same-origin"}});function Gi(t){let s="";return Tt(t,function(o,c){s+=c,s+=":",s+=o,s+=`\r
`}),s}function Pn(t,s,o){e:{for(c in o){var c=!1;break e}c=!0}c||(o=Gi(o),typeof t=="string"?o!=null&&Qe(o):O(t,s,o))}function M(t){F.call(this),this.headers=new Map,this.L=t||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}b(M,F);var po=/^https?$/i,go=["POST","PUT"];i=M.prototype,i.Fa=function(t){this.H=t},i.ea=function(t,s,o,c){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+t);s=s?s.toUpperCase():"GET",this.D=t,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():Pi.g(),this.g.onreadystatechange=k(T(this.Ca,this));try{this.B=!0,this.g.open(s,String(t),!0),this.B=!1}catch(w){Ki(this,w);return}if(t=o||"",o=new Map(this.headers),c)if(Object.getPrototypeOf(c)===Object.prototype)for(var y in c)o.set(y,c[y]);else if(typeof c.keys=="function"&&typeof c.get=="function")for(const w of c.keys())o.set(w,c.get(w));else throw Error("Unknown input type for opt_headers: "+String(c));c=Array.from(o.keys()).find(w=>w.toLowerCase()=="content-type"),y=l.FormData&&t instanceof l.FormData,!(Array.prototype.indexOf.call(go,s,void 0)>=0)||c||y||o.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[w,E]of o)this.g.setRequestHeader(w,E);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(t),this.v=!1}catch(w){Ki(this,w)}};function Ki(t,s){t.h=!1,t.g&&(t.j=!0,t.g.abort(),t.j=!1),t.l=s,t.o=5,qi(t),Rt(t)}function qi(t){t.A||(t.A=!0,j(t,"complete"),j(t,"error"))}i.abort=function(t){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=t||7,j(this,"complete"),j(this,"abort"),Rt(this))},i.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Rt(this,!0)),M.Z.N.call(this)},i.Ca=function(){this.u||(this.B||this.v||this.j?Ji(this):this.Xa())},i.Xa=function(){Ji(this)};function Ji(t){if(t.h&&typeof h<"u"){if(t.v&&de(t)==4)setTimeout(t.Ca.bind(t),0);else if(j(t,"readystatechange"),de(t)==4){t.h=!1;try{const w=t.ca();e:switch(w){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var s=!0;break e;default:s=!1}var o;if(!(o=s)){var c;if(c=w===0){let E=String(t.D).match(Bi)[1]||null;!E&&l.self&&l.self.location&&(E=l.self.location.protocol.slice(0,-1)),c=!po.test(E?E.toLowerCase():"")}o=c}if(o)j(t,"complete"),j(t,"success");else{t.o=6;try{var y=de(t)>2?t.g.statusText:""}catch{y=""}t.l=y+" ["+t.ca()+"]",qi(t)}}finally{Rt(t)}}}}function Rt(t,s){if(t.g){t.m&&(clearTimeout(t.m),t.m=null);const o=t.g;t.g=null,s||j(t,"ready");try{o.onreadystatechange=null}catch{}}}i.isActive=function(){return!!this.g};function de(t){return t.g?t.g.readyState:0}i.ca=function(){try{return de(this)>2?this.g.status:-1}catch{return-1}},i.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},i.La=function(t){if(this.g){var s=this.g.responseText;return t&&s.indexOf(t)==0&&(s=s.substring(t.length)),Ks(s)}};function Xi(t){try{if(!t.g)return null;if("response"in t.g)return t.g.response;switch(t.F){case"":case"text":return t.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in t.g)return t.g.mozResponseArrayBuffer}return null}catch{return null}}function mo(t){const s={};t=(t.g&&de(t)>=2&&t.g.getAllResponseHeaders()||"").split(`\r
`);for(let c=0;c<t.length;c++){if(f(t[c]))continue;var o=Zs(t[c]);const y=o[0];if(o=o[1],typeof o!="string")continue;o=o.trim();const w=s[y]||[];s[y]=w,w.push(o)}Hs(s,function(c){return c.join(", ")})}i.ya=function(){return this.o},i.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function at(t,s,o){return o&&o.internalChannelParams&&o.internalChannelParams[t]||s}function Yi(t){this.za=0,this.i=[],this.j=new Ye,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=at("failFast",!1,t),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=at("baseRetryDelayMs",5e3,t),this.Za=at("retryDelaySeedMs",1e4,t),this.Ta=at("forwardChannelMaxRetries",2,t),this.va=at("forwardChannelRequestTimeoutMs",2e4,t),this.ma=t&&t.xmlHttpFactory||void 0,this.Ua=t&&t.Rb||void 0,this.Aa=t&&t.useFetchStreams||!1,this.O=void 0,this.L=t&&t.supportsCrossDomainXhr||!1,this.M="",this.h=new Ni(t&&t.concurrentRequestLimit),this.Ba=new fo,this.S=t&&t.fastHandshake||!1,this.R=t&&t.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=t&&t.Pb||!1,t&&t.ua&&this.j.ua(),t&&t.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&t&&t.detectBufferingProxy||!1,this.ia=void 0,t&&t.longPollingTimeout&&t.longPollingTimeout>0&&(this.ia=t.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}i=Yi.prototype,i.ka=8,i.I=1,i.connect=function(t,s,o,c){H(0),this.W=t,this.H=s||{},o&&c!==void 0&&(this.H.OSID=o,this.H.OAID=c),this.F=this.X,this.J=or(this,null,this.W),Dt(this)};function kn(t){if(Qi(t),t.I==3){var s=t.V++,o=Y(t.J);if(O(o,"SID",t.M),O(o,"RID",s),O(o,"TYPE","terminate"),ct(t,o),s=new le(t,t.j,s),s.M=2,s.A=kt(Y(o)),o=!1,l.navigator&&l.navigator.sendBeacon)try{o=l.navigator.sendBeacon(s.A.toString(),"")}catch{}!o&&l.Image&&(new Image().src=s.A,o=!0),o||(s.g=ar(s.j,null),s.g.ea(s.A)),s.F=Date.now(),Pt(s)}sr(t)}function Ot(t){t.g&&(Rn(t),t.g.cancel(),t.g=null)}function Qi(t){Ot(t),t.v&&(l.clearTimeout(t.v),t.v=null),Nt(t),t.h.cancel(),t.m&&(typeof t.m=="number"&&l.clearTimeout(t.m),t.m=null)}function Dt(t){if(!Mi(t.h)&&!t.m){t.m=!0;var s=t.Ea;he||u(),z||(he(),z=!0),g.add(s,t),t.D=0}}function yo(t,s){return Li(t.h)>=t.h.j-(t.m?1:0)?!1:t.m?(t.i=s.G.concat(t.i),!0):t.I==1||t.I==2||t.D>=(t.Sa?0:t.Ta)?!1:(t.m=Xe(T(t.Ea,t,s),rr(t,t.D)),t.D++,!0)}i.Ea=function(t){if(this.m)if(this.m=null,this.I==1){if(!t){this.V=Math.floor(Math.random()*1e5),t=this.V++;const y=new le(this,this.j,t);let w=this.o;if(this.U&&(w?(w=li(w),fi(w,this.U)):w=this.U),this.u!==null||this.R||(y.J=w,w=null),this.S)e:{for(var s=0,o=0;o<this.i.length;o++){t:{var c=this.i[o];if("__data__"in c.map&&(c=c.map.__data__,typeof c=="string")){c=c.length;break t}c=void 0}if(c===void 0)break;if(s+=c,s>4096){s=o;break e}if(s===4096||o===this.i.length-1){s=o+1;break e}}s=1e3}else s=1e3;s=er(this,y,s),o=Y(this.J),O(o,"RID",t),O(o,"CVER",22),this.G&&O(o,"X-HTTP-Session-Id",this.G),ct(this,o),w&&(this.R?s="headers="+Qe(Gi(w))+"&"+s:this.u&&Pn(o,this.u,w)),bn(this.h,y),this.Ra&&O(o,"TYPE","init"),this.S?(O(o,"$req",s),O(o,"SID","null"),y.U=!0,vn(y,o,null)):vn(y,o,s),this.I=2}}else this.I==3&&(t?Zi(this,t):this.i.length==0||Mi(this.h)||Zi(this))};function Zi(t,s){var o;s?o=s.l:o=t.V++;const c=Y(t.J);O(c,"SID",t.M),O(c,"RID",o),O(c,"AID",t.K),ct(t,c),t.u&&t.o&&Pn(c,t.u,t.o),o=new le(t,t.j,o,t.D+1),t.u===null&&(o.J=t.o),s&&(t.i=s.G.concat(t.i)),s=er(t,o,1e3),o.H=Math.round(t.va*.5)+Math.round(t.va*.5*Math.random()),bn(t.h,o),vn(o,c,s)}function ct(t,s){t.H&&Tt(t.H,function(o,c){O(s,c,o)}),t.l&&Tt({},function(o,c){O(s,c,o)})}function er(t,s,o){o=Math.min(t.i.length,o);const c=t.l?T(t.l.Ka,t.l,t):null;e:{var y=t.i;let A=-1;for(;;){const x=["count="+o];A==-1?o>0?(A=y[0].g,x.push("ofs="+A)):A=0:x.push("ofs="+A);let C=!0;for(let B=0;B<o;B++){var w=y[B].g;const Q=y[B].map;if(w-=A,w<0)A=Math.max(0,y[B].g-100),C=!1;else try{w="req"+w+"_"||"";try{var E=Q instanceof Map?Q:Object.entries(Q);for(const[Oe,pe]of E){let ge=pe;I(pe)&&(ge=gn(pe)),x.push(w+Oe+"="+encodeURIComponent(ge))}}catch(Oe){throw x.push(w+"type="+encodeURIComponent("_badmap")),Oe}}catch{c&&c(Q)}}if(C){E=x.join("&");break e}}E=void 0}return t=t.i.splice(0,o),s.G=t,E}function tr(t){if(!t.g&&!t.v){t.Y=1;var s=t.Da;he||u(),z||(he(),z=!0),g.add(s,t),t.A=0}}function Cn(t){return t.g||t.v||t.A>=3?!1:(t.Y++,t.v=Xe(T(t.Da,t),rr(t,t.A)),t.A++,!0)}i.Da=function(){if(this.v=null,nr(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var t=4*this.T;this.j.info("BP detection timer enabled: "+t),this.B=Xe(T(this.Wa,this),t)}},i.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,H(10),Ot(this),nr(this))};function Rn(t){t.B!=null&&(l.clearTimeout(t.B),t.B=null)}function nr(t){t.g=new le(t,t.j,"rpc",t.Y),t.u===null&&(t.g.J=t.o),t.g.P=0;var s=Y(t.na);O(s,"RID","rpc"),O(s,"SID",t.M),O(s,"AID",t.K),O(s,"CI",t.F?"0":"1"),!t.F&&t.ia&&O(s,"TO",t.ia),O(s,"TYPE","xmlhttp"),ct(t,s),t.u&&t.o&&Pn(s,t.u,t.o),t.O&&(t.g.H=t.O);var o=t.g;t=t.ba,o.M=1,o.A=kt(Y(s)),o.u=null,o.R=!0,Ri(o,t)}i.Va=function(){this.C!=null&&(this.C=null,Ot(this),Cn(this),H(19))};function Nt(t){t.C!=null&&(l.clearTimeout(t.C),t.C=null)}function ir(t,s){var o=null;if(t.g==s){Nt(t),Rn(t),t.g=null;var c=2}else if(En(t.h,s))o=s.G,Ui(t.h,s),c=1;else return;if(t.I!=0){if(s.o)if(c==1){o=s.u?s.u.length:0,s=Date.now()-s.F;var y=t.D;c=St(),j(c,new Si(c,o)),Dt(t)}else tr(t);else if(y=s.m,y==3||y==0&&s.X>0||!(c==1&&yo(t,s)||c==2&&Cn(t)))switch(o&&o.length>0&&(s=t.h,s.i=s.i.concat(o)),y){case 1:Re(t,5);break;case 4:Re(t,10);break;case 3:Re(t,6);break;default:Re(t,2)}}}function rr(t,s){let o=t.Qa+Math.floor(Math.random()*t.Za);return t.isActive()||(o*=2),o*s}function Re(t,s){if(t.j.info("Error code "+s),s==2){var o=T(t.bb,t),c=t.Ua;const y=!c;c=new ue(c||"//www.google.com/images/cleardot.gif"),l.location&&l.location.protocol=="http"||et(c,"https"),kt(c),y?lo(c.toString(),o):uo(c.toString(),o)}else H(2);t.I=0,t.l&&t.l.pa(s),sr(t),Qi(t)}i.bb=function(t){t?(this.j.info("Successfully pinged google.com"),H(2)):(this.j.info("Failed to ping google.com"),H(1))};function sr(t){if(t.I=0,t.ja=[],t.l){const s=xi(t.h);(s.length!=0||t.i.length!=0)&&(D(t.ja,s),D(t.ja,t.i),t.h.i.length=0,N(t.i),t.i.length=0),t.l.oa()}}function or(t,s,o){var c=o instanceof ue?Y(o):new ue(o);if(c.g!="")s&&(c.g=s+"."+c.g),tt(c,c.u);else{var y=l.location;c=y.protocol,s=s?s+"."+y.hostname:y.hostname,y=+y.port;const w=new ue(null);c&&et(w,c),s&&(w.g=s),y&&tt(w,y),o&&(w.h=o),c=w}return o=t.G,s=t.wa,o&&s&&O(c,o,s),O(c,"VER",t.ka),ct(t,c),c}function ar(t,s,o){if(s&&!t.L)throw Error("Can't create secondary domain capable XhrIo object.");return s=t.Aa&&!t.ma?new M(new An({ab:o})):new M(t.ma),s.Fa(t.L),s}i.isActive=function(){return!!this.l&&this.l.isActive(this)};function cr(){}i=cr.prototype,i.ra=function(){},i.qa=function(){},i.pa=function(){},i.oa=function(){},i.isActive=function(){return!0},i.Ka=function(){};function Mt(){}Mt.prototype.g=function(t,s){return new W(t,s)};function W(t,s){F.call(this),this.g=new Yi(s),this.l=t,this.h=s&&s.messageUrlParams||null,t=s&&s.messageHeaders||null,s&&s.clientProtocolHeaderRequired&&(t?t["X-Client-Protocol"]="webchannel":t={"X-Client-Protocol":"webchannel"}),this.g.o=t,t=s&&s.initMessageHeaders||null,s&&s.messageContentType&&(t?t["X-WebChannel-Content-Type"]=s.messageContentType:t={"X-WebChannel-Content-Type":s.messageContentType}),s&&s.sa&&(t?t["X-WebChannel-Client-Profile"]=s.sa:t={"X-WebChannel-Client-Profile":s.sa}),this.g.U=t,(t=s&&s.Qb)&&!f(t)&&(this.g.u=t),this.A=s&&s.supportsCrossDomainXhr||!1,this.v=s&&s.sendRawJson||!1,(s=s&&s.httpSessionIdParam)&&!f(s)&&(this.g.G=s,t=this.h,t!==null&&s in t&&(t=this.h,s in t&&delete t[s])),this.j=new je(this)}b(W,F),W.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},W.prototype.close=function(){kn(this.g)},W.prototype.o=function(t){var s=this.g;if(typeof t=="string"){var o={};o.__data__=t,t=o}else this.v&&(o={},o.__data__=gn(t),t=o);s.i.push(new no(s.Ya++,t)),s.I==3&&Dt(s)},W.prototype.N=function(){this.g.l=null,delete this.j,kn(this.g),delete this.g,W.Z.N.call(this)};function hr(t){mn.call(this),t.__headers__&&(this.headers=t.__headers__,this.statusCode=t.__status__,delete t.__headers__,delete t.__status__);var s=t.__sm__;if(s){e:{for(const o in s){t=o;break e}t=void 0}(this.i=t)&&(t=this.i,s=s!==null&&t in s?s[t]:void 0),this.data=s}else this.data=t}b(hr,mn);function lr(){yn.call(this),this.status=1}b(lr,yn);function je(t){this.g=t}b(je,cr),je.prototype.ra=function(){j(this.g,"a")},je.prototype.qa=function(t){j(this.g,new hr(t))},je.prototype.pa=function(t){j(this.g,new lr)},je.prototype.oa=function(){j(this.g,"b")},Mt.prototype.createWebChannel=Mt.prototype.g,W.prototype.send=W.prototype.o,W.prototype.open=W.prototype.m,W.prototype.close=W.prototype.close,cc=function(){return new Mt},ac=function(){return St()},oc=Pe,sc={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},At.NO_ERROR=0,At.TIMEOUT=8,At.HTTP_ERROR=6,rc=At,Ai.COMPLETE="complete",ic=Ai,Ii.EventType=qe,qe.OPEN="a",qe.CLOSE="b",qe.ERROR="c",qe.MESSAGE="d",F.prototype.listen=F.prototype.J,nc=Ii,M.prototype.listenOnce=M.prototype.K,M.prototype.getLastError=M.prototype.Ha,M.prototype.getLastErrorCode=M.prototype.ya,M.prototype.getStatus=M.prototype.ca,M.prototype.getResponseJson=M.prototype.La,M.prototype.getResponseText=M.prototype.la,M.prototype.send=M.prototype.ea,M.prototype.setWithCredentials=M.prototype.Fa,tc=M}).apply(typeof xt<"u"?xt:typeof self<"u"?self:typeof window<"u"?window:{});function rs(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const hc=rs,ss=new ze("auth","Firebase",rs());/**
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
 */const qt=new Qn("@firebase/auth");function jt(i,...e){qt.logLevel<=R.WARN&&qt.warn(`Auth (${gt}): ${i}`,...e)}function Ht(i,...e){qt.logLevel<=R.ERROR&&qt.error(`Auth (${gt}): ${i}`,...e)}/**
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
 */function te(i,...e){throw ni(i,...e)}function K(i,...e){return ni(i,...e)}function nn(i,e,n){const r={...hc(),[e]:n};return new ze("auth","Firebase",r).create(e,{appName:i.name})}function Ee(i){return nn(i,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function ti(i,e,n){const r=n;if(!(e instanceof r))throw r.name!==e.constructor.name&&te(i,"argument-error"),nn(i,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function ni(i,...e){if(typeof i!="string"){const n=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=i.name),i._errorFactory.create(n,...r)}return ss.create(i,...e)}function S(i,e,...n){if(!i)throw ni(e,...n)}function re(i){const e="INTERNAL ASSERTION FAILED: "+i;throw Ht(e),new Error(e)}function oe(i,e){i||re(e)}/**
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
 */function zn(){var i;return typeof self<"u"&&((i=self.location)==null?void 0:i.href)||""}function lc(){return Tr()==="http:"||Tr()==="https:"}function Tr(){var i;return typeof self<"u"&&((i=self.location)==null?void 0:i.protocol)||null}/**
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
 */function uc(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(lc()||ko()||"connection"in navigator)?navigator.onLine:!0}function fc(){if(typeof navigator>"u")return null;const i=navigator;return i.languages&&i.languages[0]||i.language||null}/**
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
 */class mt{constructor(e,n){this.shortDelay=e,this.longDelay=n,oe(n>e,"Short delay should be less than long delay!"),this.isMobile=Ao()||Co()}get(){return uc()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
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
 */function ii(i,e){oe(i.emulator,"Emulator should always be set here");const{url:n}=i.emulator;return e?`${n}${e.startsWith("/")?e.slice(1):e}`:n}/**
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
 */class os{static initialize(e,n,r){this.fetchImpl=e,n&&(this.headersImpl=n),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;re("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;re("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;re("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
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
 */const dc={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
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
 */const pc=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],gc=new mt(3e4,6e4);function ri(i,e){return i.tenantId&&!e.tenantId?{...e,tenantId:i.tenantId}:e}async function Ge(i,e,n,r,a={}){return as(i,a,async()=>{let h={},l={};r&&(e==="GET"?l=r:h={body:JSON.stringify(r)});const I=pt({...l,key:i.config.apiKey}).slice(1),v=await i._getAdditionalHeaders();v["Content-Type"]="application/json",i.languageCode&&(v["X-Firebase-Locale"]=i.languageCode);const T={method:e,headers:v,...h};return Po()||(T.referrerPolicy="strict-origin-when-cross-origin"),i.emulatorConfig&&Yn(i.emulatorConfig.host)&&(T.credentials="include"),os.fetch()(await cs(i,i.config.apiHost,n,I),T)})}async function as(i,e,n){i._canInitEmulator=!1;const r={...dc,...e};try{const a=new yc(i),h=await Promise.race([n(),a.promise]);a.clearNetworkTimeout();const l=await h.json();if("needConfirmation"in l)throw Bt(i,"account-exists-with-different-credential",l);if(h.ok&&!("errorMessage"in l))return l;{const I=h.ok?l.errorMessage:l.error.message,[v,T]=I.split(" : ");if(v==="FEDERATED_USER_ID_ALREADY_LINKED")throw Bt(i,"credential-already-in-use",l);if(v==="EMAIL_EXISTS")throw Bt(i,"email-already-in-use",l);if(v==="USER_DISABLED")throw Bt(i,"user-disabled",l);const P=r[v]||v.toLowerCase().replace(/[_\s]+/g,"-");if(T)throw nn(i,P,T);te(i,P)}}catch(a){if(a instanceof Se)throw a;te(i,"network-request-failed",{message:String(a)})}}async function mc(i,e,n,r,a={}){const h=await Ge(i,e,n,r,a);return"mfaPendingCredential"in h&&te(i,"multi-factor-auth-required",{_serverResponse:h}),h}async function cs(i,e,n,r){const a=`${e}${n}?${r}`,h=i,l=h.config.emulator?ii(i.config,a):`${i.config.apiScheme}://${a}`;return pc.includes(n)&&(await h._persistenceManagerAvailable,h._getPersistenceType()==="COOKIE")?h._getPersistence()._getFinalTarget(l).toString():l}class yc{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((n,r)=>{this.timer=setTimeout(()=>r(K(this.auth,"network-request-failed")),gc.get())})}}function Bt(i,e,n){const r={appName:i.name};n.email&&(r.email=n.email),n.phoneNumber&&(r.phoneNumber=n.phoneNumber);const a=K(i,e,r);return a.customData._tokenResponse=n,a}/**
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
 */async function _c(i,e){return Ge(i,"POST","/v1/accounts:delete",e)}async function Jt(i,e){return Ge(i,"POST","/v1/accounts:lookup",e)}/**
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
 */function lt(i){if(i)try{const e=new Date(Number(i));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function wc(i,e=!1){const n=ne(i),r=await n.getIdToken(e),a=si(r);S(a&&a.exp&&a.auth_time&&a.iat,n.auth,"internal-error");const h=typeof a.firebase=="object"?a.firebase:void 0,l=h==null?void 0:h.sign_in_provider;return{claims:a,token:r,authTime:lt(xn(a.auth_time)),issuedAtTime:lt(xn(a.iat)),expirationTime:lt(xn(a.exp)),signInProvider:l||null,signInSecondFactor:(h==null?void 0:h.sign_in_second_factor)||null}}function xn(i){return Number(i)*1e3}function si(i){const[e,n,r]=i.split(".");if(e===void 0||n===void 0||r===void 0)return Ht("JWT malformed, contained fewer than 3 sections"),null;try{const a=Gr(n);return a?JSON.parse(a):(Ht("Failed to decode base64 JWT payload"),null)}catch(a){return Ht("Caught error parsing JWT payload as JSON",a==null?void 0:a.toString()),null}}function Er(i){const e=si(i);return S(e,"internal-error"),S(typeof e.exp<"u","internal-error"),S(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
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
 */async function dt(i,e,n=!1){if(n)return e;try{return await e}catch(r){throw hs(r)&&i.auth.currentUser===i&&await i.auth.signOut(),r}}function hs(i){return i instanceof Se?i.code==="auth/user-disabled"||i.code==="auth/user-token-expired":!1}/**
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
 */class vc{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const n=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),n}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const n=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},n)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
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
 */class Gn{constructor(e,n){this.createdAt=e,this.lastLoginAt=n,this._initializeTime()}_initializeTime(){this.lastSignInTime=lt(this.lastLoginAt),this.creationTime=lt(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
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
 */async function Xt(i){var b;const e=i.auth,n=await i.getIdToken(),r=await dt(i,Jt(e,{idToken:n}));S(r==null?void 0:r.users.length,e,"internal-error");const a=r.users[0];i._notifyReloadListener(a);const h=(b=a.providerUserInfo)!=null&&b.length?ls(a.providerUserInfo):[],l=Tc(i.providerData,h),I=i.isAnonymous,v=!(i.email&&a.passwordHash)&&!(l!=null&&l.length),T=I?v:!1,P={uid:a.localId,displayName:a.displayName||null,photoURL:a.photoUrl||null,email:a.email||null,emailVerified:a.emailVerified||!1,phoneNumber:a.phoneNumber||null,tenantId:a.tenantId||null,providerData:l,metadata:new Gn(a.createdAt,a.lastLoginAt),isAnonymous:T};Object.assign(i,P)}async function Ic(i){const e=ne(i);await Xt(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function Tc(i,e){return[...i.filter(r=>!e.some(a=>a.providerId===r.providerId)),...e]}function ls(i){return i.map(({providerId:e,...n})=>({providerId:e,uid:n.rawId||"",displayName:n.displayName||null,email:n.email||null,phoneNumber:n.phoneNumber||null,photoURL:n.photoUrl||null}))}/**
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
 */async function Ec(i,e){const n=await as(i,{},async()=>{const r=pt({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:a,apiKey:h}=i.config,l=await cs(i,a,"/v1/token",`key=${h}`),I=await i._getAdditionalHeaders();I["Content-Type"]="application/x-www-form-urlencoded";const v={method:"POST",headers:I,body:r};return i.emulatorConfig&&Yn(i.emulatorConfig.host)&&(v.credentials="include"),os.fetch()(l,v)});return{accessToken:n.access_token,expiresIn:n.expires_in,refreshToken:n.refresh_token}}async function bc(i,e){return Ge(i,"POST","/v2/accounts:revokeToken",ri(i,e))}/**
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
 */class He{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e5}updateFromServerResponse(e){S(e.idToken,"internal-error"),S(typeof e.idToken<"u","internal-error"),S(typeof e.refreshToken<"u","internal-error");const n="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Er(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,n)}updateFromIdToken(e){S(e.length!==0,"internal-error");const n=Er(e);this.updateTokensAndExpiration(e,null,n)}async getToken(e,n=!1){return!n&&this.accessToken&&!this.isExpired?this.accessToken:(S(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,n){const{accessToken:r,refreshToken:a,expiresIn:h}=await Ec(e,n);this.updateTokensAndExpiration(r,a,Number(h))}updateTokensAndExpiration(e,n,r){this.refreshToken=n||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,n){const{refreshToken:r,accessToken:a,expirationTime:h}=n,l=new He;return r&&(S(typeof r=="string","internal-error",{appName:e}),l.refreshToken=r),a&&(S(typeof a=="string","internal-error",{appName:e}),l.accessToken=a),h&&(S(typeof h=="number","internal-error",{appName:e}),l.expirationTime=h),l}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new He,this.toJSON())}_performRefresh(){return re("not implemented")}}/**
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
 */function me(i,e){S(typeof i=="string"||typeof i>"u","internal-error",{appName:e})}class q{constructor({uid:e,auth:n,stsTokenManager:r,...a}){this.providerId="firebase",this.proactiveRefresh=new vc(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=n,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=a.displayName||null,this.email=a.email||null,this.emailVerified=a.emailVerified||!1,this.phoneNumber=a.phoneNumber||null,this.photoURL=a.photoURL||null,this.isAnonymous=a.isAnonymous||!1,this.tenantId=a.tenantId||null,this.providerData=a.providerData?[...a.providerData]:[],this.metadata=new Gn(a.createdAt||void 0,a.lastLoginAt||void 0)}async getIdToken(e){const n=await dt(this,this.stsTokenManager.getToken(this.auth,e));return S(n,this.auth,"internal-error"),this.accessToken!==n&&(this.accessToken=n,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),n}getIdTokenResult(e){return wc(this,e)}reload(){return Ic(this)}_assign(e){this!==e&&(S(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(n=>({...n})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const n=new q({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return n.metadata._copy(this.metadata),n}_onReload(e){S(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,n=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),n&&await Xt(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(G(this.auth.app))return Promise.reject(Ee(this.auth));const e=await this.getIdToken();return await dt(this,_c(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,n){const r=n.displayName??void 0,a=n.email??void 0,h=n.phoneNumber??void 0,l=n.photoURL??void 0,I=n.tenantId??void 0,v=n._redirectEventId??void 0,T=n.createdAt??void 0,P=n.lastLoginAt??void 0,{uid:b,emailVerified:k,isAnonymous:N,providerData:D,stsTokenManager:U}=n;S(b&&U,e,"internal-error");const L=He.fromJSON(this.name,U);S(typeof b=="string",e,"internal-error"),me(r,e.name),me(a,e.name),S(typeof k=="boolean",e,"internal-error"),S(typeof N=="boolean",e,"internal-error"),me(h,e.name),me(l,e.name),me(I,e.name),me(v,e.name),me(T,e.name),me(P,e.name);const X=new q({uid:b,auth:e,email:a,emailVerified:k,displayName:r,isAnonymous:N,photoURL:l,phoneNumber:h,tenantId:I,stsTokenManager:L,createdAt:T,lastLoginAt:P});return D&&Array.isArray(D)&&(X.providerData=D.map(ae=>({...ae}))),v&&(X._redirectEventId=v),X}static async _fromIdTokenResponse(e,n,r=!1){const a=new He;a.updateFromServerResponse(n);const h=new q({uid:n.localId,auth:e,stsTokenManager:a,isAnonymous:r});return await Xt(h),h}static async _fromGetAccountInfoResponse(e,n,r){const a=n.users[0];S(a.localId!==void 0,"internal-error");const h=a.providerUserInfo!==void 0?ls(a.providerUserInfo):[],l=!(a.email&&a.passwordHash)&&!(h!=null&&h.length),I=new He;I.updateFromIdToken(r);const v=new q({uid:a.localId,auth:e,stsTokenManager:I,isAnonymous:l}),T={uid:a.localId,displayName:a.displayName||null,photoURL:a.photoUrl||null,email:a.email||null,emailVerified:a.emailVerified||!1,phoneNumber:a.phoneNumber||null,tenantId:a.tenantId||null,providerData:h,metadata:new Gn(a.createdAt,a.lastLoginAt),isAnonymous:!(a.email&&a.passwordHash)&&!(h!=null&&h.length)};return Object.assign(v,T),v}}/**
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
 */const br=new Map;function se(i){oe(i instanceof Function,"Expected a class definition");let e=br.get(i);return e?(oe(e instanceof i,"Instance stored in cache mismatched with class"),e):(e=new i,br.set(i,e),e)}/**
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
 */class us{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,n){this.storage[e]=n}async _get(e){const n=this.storage[e];return n===void 0?null:n}async _remove(e){delete this.storage[e]}_addListener(e,n){}_removeListener(e,n){}}us.type="NONE";const Sr=us;/**
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
 */function $t(i,e,n){return`firebase:${i}:${e}:${n}`}class Me{constructor(e,n,r){this.persistence=e,this.auth=n,this.userKey=r;const{config:a,name:h}=this.auth;this.fullUserKey=$t(this.userKey,a.apiKey,h),this.fullPersistenceKey=$t("persistence",a.apiKey,h),this.boundEventHandler=n._onStorageEvent.bind(n);try{this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}catch{}}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const n=await Jt(this.auth,{idToken:e}).catch(()=>{});return n?q._fromGetAccountInfoResponse(this.auth,n,e):null}return q._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const n=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,n)return this.setCurrentUser(n)}delete(){try{this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}catch{}}static async create(e,n,r="authUser"){if(!n.length)return new Me(se(Sr),e,r);const a=$t(r,e.config.apiKey,e.name);let h=null,l=null;const I=new Set;for(const k of n){let N=null;try{N=await k._get(a)}catch{I.add(k);continue}try{if(N){let D;if(typeof N=="string"){const U=await Jt(e,{idToken:N}).catch(()=>{});if(!U)break;D=await q._fromGetAccountInfoResponse(e,U,N)}else D=q._fromJSON(e,N);h=D,l=k;break}}catch{}}const v=(await Promise.all(n.map(async k=>{try{if(await k._isAvailable())return k;k._lastProbeTimedOut&&I.add(k)}catch{return}}))).filter(k=>k);let T=v[0]||se(Sr),P=null;l&&h&&(l!==T&&(P=h),T=l);const b=v.filter(k=>k._shouldAllowMigration);return!T._shouldAllowMigration||!b.length?new Me(T,e,r):(T=b[0],P&&await T._set(a,P.toJSON()),await Promise.all(n.map(async k=>{if(k!==T&&!I.has(k))try{await k._remove(a)}catch{}})),new Me(T,e,r))}}/**
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
 */function Ar(i){const e=i.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(gs(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(fs(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(ys(e))return"Blackberry";if(_s(e))return"Webos";if(ds(e))return"Safari";if((e.includes("chrome/")||ps(e))&&!e.includes("edge/"))return"Chrome";if(ms(e))return"Android";{const n=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=i.match(n);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function fs(i=$()){return/firefox\//i.test(i)}function ds(i=$()){const e=i.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function ps(i=$()){return/crios\//i.test(i)}function gs(i=$()){return/iemobile/i.test(i)}function ms(i=$()){return/android/i.test(i)}function ys(i=$()){return/blackberry/i.test(i)}function _s(i=$()){return/webos/i.test(i)}function oi(i=$()){return/iphone|ipad|ipod/i.test(i)||/macintosh/i.test(i)&&/mobile/i.test(i)}function Sc(i=$()){var e;return oi(i)&&!!((e=window.navigator)!=null&&e.standalone)}function Ac(){return Ro()&&document.documentMode===10}function ws(i=$()){return oi(i)||ms(i)||_s(i)||ys(i)||/windows phone/i.test(i)||gs(i)}/**
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
 */function vs(i,e=[]){let n;switch(i){case"Browser":n=Ar($());break;case"Worker":n=`${Ar($())}-${i}`;break;default:n=i}const r=e.length?e.join(","):"FirebaseCore-web";return`${n}/JsCore/${gt}/${r}`}/**
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
 */class Pc{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,n){const r=h=>new Promise((l,I)=>{try{const v=e(h);l(v)}catch(v){I(v)}});r.onAbort=n,this.queue.push(r);const a=this.queue.length-1;return()=>{this.queue[a]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const n=[];try{for(const r of this.queue)await r(e),r.onAbort&&n.push(r.onAbort)}catch(r){n.reverse();for(const a of n)try{a()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}}/**
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
 */async function kc(i,e={}){return Ge(i,"GET","/v2/passwordPolicy",ri(i,e))}/**
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
 */const Cc=6;class Rc{constructor(e){var r;const n=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=n.minPasswordLength??Cc,n.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=n.maxPasswordLength),n.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=n.containsLowercaseCharacter),n.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=n.containsUppercaseCharacter),n.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=n.containsNumericCharacter),n.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=n.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((r=e.allowedNonAlphanumericCharacters)==null?void 0:r.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const n={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,n),this.validatePasswordCharacterOptions(e,n),n.isValid&&(n.isValid=n.meetsMinPasswordLength??!0),n.isValid&&(n.isValid=n.meetsMaxPasswordLength??!0),n.isValid&&(n.isValid=n.containsLowercaseLetter??!0),n.isValid&&(n.isValid=n.containsUppercaseLetter??!0),n.isValid&&(n.isValid=n.containsNumericCharacter??!0),n.isValid&&(n.isValid=n.containsNonAlphanumericCharacter??!0),n}validatePasswordLengthOptions(e,n){const r=this.customStrengthOptions.minPasswordLength,a=this.customStrengthOptions.maxPasswordLength;r&&(n.meetsMinPasswordLength=e.length>=r),a&&(n.meetsMaxPasswordLength=e.length<=a)}validatePasswordCharacterOptions(e,n){this.updatePasswordCharacterOptionsStatuses(n,!1,!1,!1,!1);let r;for(let a=0;a<e.length;a++)r=e.charAt(a),this.updatePasswordCharacterOptionsStatuses(n,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,n,r,a,h){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=n)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=a)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=h))}}/**
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
 */class Oc{constructor(e,n,r,a){this.app=e,this.heartbeatServiceProvider=n,this.appCheckServiceProvider=r,this.config=a,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Pr(this),this.idTokenSubscription=new Pr(this),this.beforeStateQueue=new Pc(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=ss,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=a.sdkClientVersion,this._persistenceManagerAvailable=new Promise(h=>this._resolvePersistenceManagerAvailable=h)}_initializeWithPersistence(e,n){return n&&(this._popupRedirectResolver=se(n)),this._initializationPromise=this.queue(async()=>{var r,a,h;if(!this._deleted){try{this.persistenceManager=await Me.create(this,e)}catch(l){jt(`Failed to initialize persistence: ${l}`),this.persistenceManager=await Me.create(this,[])}finally{(r=this._resolvePersistenceManagerAvailable)==null||r.call(this)}if(!this._deleted){if((a=this._popupRedirectResolver)!=null&&a._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}try{await this.initializeCurrentUser(n)}catch(l){jt(`Failed to initialize current user: ${l}`)}this.lastNotifiedUid=((h=this.currentUser)==null?void 0:h.uid)||null,!this._deleted&&(this._isInitialized=!0)}}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const n=await Jt(this,{idToken:e}),r=await q._fromGetAccountInfoResponse(this,n,e);await this.directlySetCurrentUser(r)}catch(n){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",n),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var h;if(G(this.app)){const l=this.app.settings.authIdToken;return l?new Promise(I=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(l).then(I,I))}):this.directlySetCurrentUser(null)}const n=await this.assertedPersistence.getCurrentUser();let r=n,a=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const l=(h=this.redirectUser)==null?void 0:h._redirectEventId,I=r==null?void 0:r._redirectEventId,v=await this.tryRedirectSignIn(e);(!l||l===I)&&(v!=null&&v.user)&&(r=v.user,a=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(a)try{await this.beforeStateQueue.runMiddleware(r)}catch(l){r=n,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(l))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return S(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let n=null;try{n=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return n}async reloadAndSetCurrentUserOrClear(e){try{await Xt(e)}catch(n){if(hs(n))return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=fc()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(G(this.app))return Promise.reject(Ee(this));const n=e?ne(e):null;return n&&S(n.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(n&&n._clone(this))}async _updateCurrentUser(e,n=!1){if(!this._deleted)return e&&S(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),n||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return G(this.app)?Promise.reject(Ee(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return G(this.app)?Promise.reject(Ee(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(se(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const n=this._getPasswordPolicyInternal();return n.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):n.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await kc(this),n=new Rc(e);this.tenantId===null?this._projectPasswordPolicy=n:this._tenantPasswordPolicies[this.tenantId]=n}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new ze("auth","Firebase",e())}onAuthStateChanged(e,n,r){return this.registerStateListener(this.authStateSubscription,e,n,r)}beforeAuthStateChanged(e,n){return this.beforeStateQueue.pushCallback(e,n)}onIdTokenChanged(e,n,r){return this.registerStateListener(this.idTokenSubscription,e,n,r)}authStateReady(){return new Promise((e,n)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},n)}})}async revokeAccessToken(e){if(this.currentUser){const n=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:n};this.tenantId!=null&&(r.tenantId=this.tenantId),await bc(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,n){const r=await this.getOrInitRedirectPersistenceManager(n);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const n=e&&se(e)||this._popupRedirectResolver;S(n,this,"argument-error"),this.redirectPersistenceManager=await Me.create(this,[se(n._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var n,r;return this._isInitialized&&await this.queue(async()=>{}),((n=this._currentUser)==null?void 0:n._redirectEventId)===e?this._currentUser:((r=this.redirectUser)==null?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var n;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((n=this.currentUser)==null?void 0:n.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,n,r,a){if(this._deleted)return()=>{};const h=typeof n=="function"?n:n.next.bind(n);let l=!1;const I=this._isInitialized?Promise.resolve():this._initializationPromise;if(S(I,this,"internal-error"),I.then(()=>{l||h(this.currentUser)}).catch(v=>{if(!l)if(typeof n!="function"&&n.error)n.error(v);else if(r)r(v);else throw v}),typeof n=="function"){const v=e.addObserver(n,r,a);return()=>{l=!0,v()}}else{const v=e.addObserver(n);return()=>{l=!0,v()}}}async directlySetCurrentUser(e){if(this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,this.persistenceManager)try{e?await this.persistenceManager.setCurrentUser(e):await this.persistenceManager.removeCurrentUser()}catch(n){const r=(n==null?void 0:n.message)||String(n),a=nn(this,"internal-error",`An internal AuthError has occurred: ${r}`);throw a.customData={originalError:n},a}}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return S(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=vs(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var a;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const n=await((a=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:a.getHeartbeatsHeader());n&&(e["X-Firebase-Client"]=n);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){var n;if(G(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((n=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:n.getToken());return e!=null&&e.error&&jt(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function yt(i){return ne(i)}class Pr{constructor(e){this.auth=e,this.observer=null,this.addObserver=Lo(n=>this.observer=n)}get next(){return S(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
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
 */let ai={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function Dc(i){ai=i}function Nc(i){return ai.loadJS(i)}function Mc(){return ai.gapiScript}function Lc(i){return`__${i}${Math.floor(Math.random()*1e6)}`}/**
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
 */function Uc(i,e){const n=ei(i,"auth");if(n.isInitialized()){const a=n.getImmediate(),h=n.getOptions();if(Ve(h,e??{}))return a;te(a,"already-initialized")}return n.initialize({options:e})}function xc(i,e){const n=(e==null?void 0:e.persistence)||[],r=(Array.isArray(n)?n:[n]).map(se);e!=null&&e.errorMap&&i._updateErrorMap(e.errorMap),i._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}function Bc(i,e,n){const r=yt(i);S(/^https?:\/\//.test(e),r,"invalid-emulator-scheme");const a=!1,h=Is(e),{host:l,port:I}=Fc(e),v=I===null?"":`:${I}`,T={url:`${h}//${l}${v}/`},P=Object.freeze({host:l,port:I,protocol:h.replace(":",""),options:Object.freeze({disableWarnings:a})});if(!r._canInitEmulator){S(r.config.emulator&&r.emulatorConfig,r,"emulator-config-failed"),S(Ve(T,r.config.emulator)&&Ve(P,r.emulatorConfig),r,"emulator-config-failed");return}r.config.emulator=T,r.emulatorConfig=P,r.settings.appVerificationDisabledForTesting=!0,Yn(l)?Bo(`${h}//${l}${v}`):jc()}function Is(i){const e=i.indexOf(":");return e<0?"":i.substr(0,e+1)}function Fc(i){const e=Is(i),n=/(\/\/)?([^?#/]+)/.exec(i.substr(e.length));if(!n)return{host:"",port:null};const r=n[2].split("@").pop()||"",a=/^(\[[^\]]+\])(:|$)/.exec(r);if(a){const h=a[1];return{host:h,port:kr(r.substr(h.length+1))}}else{const[h,l]=r.split(":");return{host:h,port:kr(l)}}}function kr(i){if(!i)return null;const e=Number(i);return isNaN(e)?null:e}function jc(){function i(){const e=document.createElement("p"),n=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",n.position="fixed",n.width="100%",n.backgroundColor="#ffffff",n.border=".1em solid #000000",n.color="#b50000",n.bottom="0px",n.left="0px",n.margin="0px",n.zIndex="10000",n.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",i):i())}/**
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
 */class Ts{constructor(e,n){this.providerId=e,this.signInMethod=n}toJSON(){return re("not implemented")}_getIdTokenResponse(e){return re("not implemented")}_linkToIdToken(e,n){return re("not implemented")}_getReauthenticationResolver(e){return re("not implemented")}}/**
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
 */async function $e(i,e){return mc(i,"POST","/v1/accounts:signInWithIdp",ri(i,e))}/**
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
 */const Hc="http://localhost";class Ue extends Ts{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const n=new Ue(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(n.idToken=e.idToken),e.accessToken&&(n.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(n.nonce=e.nonce),e.pendingToken&&(n.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(n.accessToken=e.oauthToken,n.secret=e.oauthTokenSecret):te("argument-error"),n}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const n=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:a,...h}=n;if(!r||!a)return null;const l=new Ue(r,a);return l.idToken=h.idToken||void 0,l.accessToken=h.accessToken||void 0,l.secret=h.secret,l.nonce=h.nonce,l.pendingToken=h.pendingToken||null,l}_getIdTokenResponse(e){const n=this.buildRequest();return $e(e,n)}_linkToIdToken(e,n){const r=this.buildRequest();return r.idToken=n,$e(e,r)}_getReauthenticationResolver(e){const n=this.buildRequest();return n.autoCreate=!1,$e(e,n)}buildRequest(){const e={requestUri:Hc,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const n={};this.idToken&&(n.id_token=this.idToken),this.accessToken&&(n.access_token=this.accessToken),this.secret&&(n.oauth_token_secret=this.secret),n.providerId=this.providerId,this.nonce&&!this.pendingToken&&(n.nonce=this.nonce),e.postBody=pt(n)}return e}}/**
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
 */class _t{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
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
 */class wt extends _t{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
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
 */class ye extends wt{constructor(){super("facebook.com")}static credential(e){return Ue._fromParams({providerId:ye.PROVIDER_ID,signInMethod:ye.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return ye.credentialFromTaggedObject(e)}static credentialFromError(e){return ye.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return ye.credential(e.oauthAccessToken)}catch{return null}}}ye.FACEBOOK_SIGN_IN_METHOD="facebook.com";ye.PROVIDER_ID="facebook.com";/**
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
 */class _e extends wt{constructor(){super("google.com"),this.addScope("profile")}static credential(e,n){return Ue._fromParams({providerId:_e.PROVIDER_ID,signInMethod:_e.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:n})}static credentialFromResult(e){return _e.credentialFromTaggedObject(e)}static credentialFromError(e){return _e.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:n,oauthAccessToken:r}=e;if(!n&&!r)return null;try{return _e.credential(n,r)}catch{return null}}}_e.GOOGLE_SIGN_IN_METHOD="google.com";_e.PROVIDER_ID="google.com";/**
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
 */class we extends wt{constructor(){super("github.com")}static credential(e){return Ue._fromParams({providerId:we.PROVIDER_ID,signInMethod:we.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return we.credentialFromTaggedObject(e)}static credentialFromError(e){return we.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return we.credential(e.oauthAccessToken)}catch{return null}}}we.GITHUB_SIGN_IN_METHOD="github.com";we.PROVIDER_ID="github.com";/**
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
 */class ve extends wt{constructor(){super("twitter.com")}static credential(e,n){return Ue._fromParams({providerId:ve.PROVIDER_ID,signInMethod:ve.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:n})}static credentialFromResult(e){return ve.credentialFromTaggedObject(e)}static credentialFromError(e){return ve.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:n,oauthTokenSecret:r}=e;if(!n||!r)return null;try{return ve.credential(n,r)}catch{return null}}}ve.TWITTER_SIGN_IN_METHOD="twitter.com";ve.PROVIDER_ID="twitter.com";/**
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
 */class We{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,n,r,a=!1){const h=await q._fromIdTokenResponse(e,r,a),l=Cr(r);return new We({user:h,providerId:l,_tokenResponse:r,operationType:n})}static async _forOperation(e,n,r){await e._updateTokensIfNecessary(r,!0);const a=Cr(r);return new We({user:e,providerId:a,_tokenResponse:r,operationType:n})}}function Cr(i){return i.providerId?i.providerId:"phoneNumber"in i?"phone":null}/**
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
 */class Yt extends Se{constructor(e,n,r,a){super(n.code,n.message),this.operationType=r,this.user=a,Object.setPrototypeOf(this,Yt.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:n.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,n,r,a){return new Yt(e,n,r,a)}}function Es(i,e,n,r){return(e==="reauthenticate"?n._getReauthenticationResolver(i):n._getIdTokenResponse(i)).catch(h=>{throw h.code==="auth/multi-factor-auth-required"?Yt._fromErrorAndOperation(i,h,e,r):h})}async function $c(i,e,n=!1){const r=await dt(i,e._linkToIdToken(i.auth,await i.getIdToken()),n);return We._forOperation(i,"link",r)}/**
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
 */async function Vc(i,e,n=!1){const{auth:r}=i;if(G(r.app))return Promise.reject(Ee(r));const a="reauthenticate";try{const h=await dt(i,Es(r,a,e,i),n);S(h.idToken,r,"internal-error");const l=si(h.idToken);S(l,r,"internal-error");const{sub:I}=l;return S(i.uid===I,r,"user-mismatch"),We._forOperation(i,a,h)}catch(h){throw(h==null?void 0:h.code)==="auth/user-not-found"&&te(r,"user-mismatch"),h}}/**
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
 */async function Wc(i,e,n=!1){if(G(i.app))return Promise.reject(Ee(i));const r="signIn",a=await Es(i,r,e),h=await We._fromIdTokenResponse(i,r,a);return n||await i._updateCurrentUser(h.user),h}function zc(i,e,n,r){return ne(i).onIdTokenChanged(e,n,r)}function Gc(i,e,n){return ne(i).beforeAuthStateChanged(e,n)}function Ul(i,e,n,r){return ne(i).onAuthStateChanged(e,n,r)}function xl(i){return ne(i).signOut()}async function Bl(i){return ne(i).delete()}const Qt="__sak";/**
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
 */class bs{constructor(e,n){this.storageRetriever=e,this.type=n}_isAvailable(){try{return this.storage?(this.storage.setItem(Qt,"1"),this.storage.removeItem(Qt),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,n){return this.storage.setItem(e,JSON.stringify(n)),Promise.resolve()}_get(e){const n=this.storage.getItem(e);return Promise.resolve(n?JSON.parse(n):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
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
 */const Kc=1e3,qc=10;class Ss extends bs{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,n)=>this.onStorageEvent(e,n),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=ws(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const n of Object.keys(this.listeners)){const r=this.storage.getItem(n),a=this.localCache[n];r!==a&&e(n,a,r)}}onStorageEvent(e,n=!1){if(!e.key){this.forAllChangedKeys((l,I,v)=>{this.notifyListeners(l,v)});return}const r=e.key;n?this.detachListener():this.stopPolling();const a=()=>{const l=this.storage.getItem(r);!n&&this.localCache[r]===l||this.notifyListeners(r,l)},h=this.storage.getItem(r);Ac()&&h!==e.newValue&&e.newValue!==e.oldValue?setTimeout(a,qc):a()}notifyListeners(e,n){this.localCache[e]=n;const r=this.listeners[e];if(r)for(const a of Array.from(r))a(n&&JSON.parse(n))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,n,r)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:n,newValue:r}),!0)})},Kc)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,n){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(n)}_removeListener(e,n){this.listeners[e]&&(this.listeners[e].delete(n),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,n){await super._set(e,n),this.localCache[e]=JSON.stringify(n)}async _get(e){const n=await super._get(e);return this.localCache[e]=JSON.stringify(n),n}async _remove(e){await super._remove(e),delete this.localCache[e]}}Ss.type="LOCAL";const Jc=Ss;/**
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
 */class As extends bs{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,n){}_removeListener(e,n){}}As.type="SESSION";const Ps=As;/**
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
 */function Xc(i){return Promise.all(i.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(n){return{fulfilled:!1,reason:n}}}))}/**
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
 */class rn{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const n=this.receivers.find(a=>a.isListeningto(e));if(n)return n;const r=new rn(e);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const n=e,{eventId:r,eventType:a,data:h}=n.data,l=this.handlersMap[a];if(!(l!=null&&l.size))return;n.ports[0].postMessage({status:"ack",eventId:r,eventType:a});const I=Array.from(l).map(async T=>T(n.origin,h)),v=await Xc(I);n.ports[0].postMessage({status:"done",eventId:r,eventType:a,response:v})}_subscribe(e,n){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(n)}_unsubscribe(e,n){this.handlersMap[e]&&n&&this.handlersMap[e].delete(n),(!n||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}rn.receivers=[];/**
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
 */function ci(i="",e=10){let n="";for(let r=0;r<e;r++)n+=Math.floor(Math.random()*10);return i+n}/**
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
 */class Yc{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,n,r=50){const a=typeof MessageChannel<"u"?new MessageChannel:null;if(!a)throw new Error("connection_unavailable");let h,l;return new Promise((I,v)=>{const T=ci("",20);a.port1.start();const P=setTimeout(()=>{v(new Error("unsupported_event"))},r);l={messageChannel:a,onMessage(b){const k=b;if(k.data.eventId===T)switch(k.data.status){case"ack":clearTimeout(P),h=setTimeout(()=>{v(new Error("timeout"))},3e3);break;case"done":clearTimeout(h),I(k.data.response);break;default:clearTimeout(P),clearTimeout(h),v(new Error("invalid_response"));break}}},this.handlers.add(l),a.port1.addEventListener("message",l.onMessage),this.target.postMessage({eventType:e,eventId:T,data:n},[a.port2])}).finally(()=>{l&&this.removeMessageHandler(l)})}}/**
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
 */function Z(){return window}function Qc(i){Z().location.href=i}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */function ks(){return typeof Z().WorkerGlobalScope<"u"&&typeof Z().importScripts=="function"}async function Zc(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function eh(){var i;return((i=navigator==null?void 0:navigator.serviceWorker)==null?void 0:i.controller)||null}function th(){return ks()?self:null}/**
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
 */const Cs="firebaseLocalStorageDb",nh=1,Zt="firebaseLocalStorage",Rs="fbase_key",ih=800,rh=3,Rr=800,sn=2500,ut="DB_TIMEOUT";class vt{constructor(e){this.request=e}toPromise(e=sn){return new Promise((n,r)=>{let a=!1;const h=setTimeout(()=>{var l;if(!a){a=!0;try{(l=this.request.transaction)==null||l.abort()}catch{}r(new Error(ut))}},e);this.request.addEventListener("success",()=>{a||(a=!0,clearTimeout(h),n(this.request.result))}),this.request.addEventListener("error",()=>{a||(a=!0,clearTimeout(h),r(this.request.error))})})}}function on(i,e){return i.transaction([Zt],e?"readwrite":"readonly").objectStore(Zt)}function sh(){const i=indexedDB.deleteDatabase(Cs);return new vt(i).toPromise()}function Os(){const i=indexedDB.open(Cs,nh);return new Promise((e,n)=>{let r=!1;const a=setTimeout(()=>{r||(r=!0,n(new Error(ut)))},sn);i.addEventListener("error",()=>{r||(r=!0,clearTimeout(a),n(i.error))}),i.addEventListener("upgradeneeded",()=>{const h=i.result;try{h.createObjectStore(Zt,{keyPath:Rs})}catch(l){r||(r=!0,clearTimeout(a),n(l))}}),i.addEventListener("success",async()=>{const h=i.result;if(r){h.close();return}if(clearTimeout(a),h.objectStoreNames.contains(Zt))r=!0,e(h);else{h.close();try{await sh();const l=await Os();r=!0,e(l)}catch(l){r||(r=!0,n(l))}}})})}async function Or(i,e,n,r=sn){const a=on(i,!0).put({[Rs]:e,value:n});return new vt(a).toPromise(r)}async function oh(i,e){const n=on(i,!1).get(e),r=await new vt(n).toPromise();return r===void 0?null:r.value}function Dr(i,e,n=sn){const r=on(i,!0).delete(e);return new vt(r).toPromise(n)}class Ds{registerLifecycleListeners(){typeof window<"u"&&typeof window.addEventListener=="function"&&(window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow))}unregisterLifecycleListeners(){typeof window<"u"&&typeof window.removeEventListener=="function"&&(window.removeEventListener("pagehide",this.onPageHide),window.removeEventListener("pageshow",this.onPageShow))}constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.isClosing=!1,this.pendingWrites=0,this._lastProbeTimedOut=!1,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this.onPageHide=()=>{this.isClosing=!0,this.stopPolling(),this.dbPromise&&(this.dbPromise.then(e=>e.close()).catch(()=>{}),this.dbPromise=null)},this.onPageShow=()=>{this.isClosing&&(this.isClosing=!1,Object.keys(this.listeners).length>0&&this.startPolling())},this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){if(this.dbPromise)return this.dbPromise;const e=Os();return this.dbPromise=e,e.catch(()=>{this.dbPromise===e&&(this.dbPromise=null)}),e}async _withRetries(e){let n=0;for(;;){let r,a=null;try{const h=this._openDb();return a=this.dbPromise,r=await h,await e(r)}catch(h){if(r)r.close(),a&&this.dbPromise===a&&(this.dbPromise=null);else if(this.dbPromise&&this.dbPromise===a){const I=this.dbPromise;this.dbPromise=null;try{(await I).close()}catch{}}if(h instanceof Error&&h.message===ut||n++>rh)throw h}}}async initializeServiceWorkerMessaging(){return ks()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=rn._getInstance(th()),this.receiver._subscribe("keyChanged",async(e,n)=>({keyProcessed:(await this._poll()).includes(n.key)})),this.receiver._subscribe("ping",async(e,n)=>["keyChanged"])}async initializeSender(){var n,r;if(this.activeServiceWorker=await Zc(),!this.activeServiceWorker)return;this.sender=new Yc(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(n=e[0])!=null&&n.fulfilled&&(r=e[0])!=null&&r.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||eh()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){this._lastProbeTimedOut=!1;try{return indexedDB?(await this._withRetries(async e=>{await Or(e,Qt,"1",Rr),await Dr(e,Qt,Rr)}),!0):!1}catch(e){this._lastProbeTimedOut=e instanceof Error&&e.message===ut}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,n){return this._withPendingWrite(async()=>(await this._withRetries(r=>Or(r,e,n)),this.localCache[e]=n,this.notifyServiceWorker(e)))}async _get(e){try{const n=await this._withRetries(r=>oh(r,e));return this.localCache[e]=n,n}catch(n){if(n instanceof Error&&n.message===ut&&this.localCache[e]!=null)return this.localCache[e];throw n}}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(n=>Dr(n,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){if(this.isClosing)return[];try{const e=await this._withRetries(a=>{const h=on(a,!1).getAll();return new vt(h).toPromise()});if(this.isClosing)return[];if(!e)return[];if(this.pendingWrites!==0)return[];const n=[],r=new Set;if(e.length!==0)for(const{fbase_key:a,value:h}of e)r.add(a),JSON.stringify(this.localCache[a])!==JSON.stringify(h)&&(this.notifyListeners(a,h),n.push(a));for(const a of Object.keys(this.localCache))this.localCache[a]&&!r.has(a)&&(this.notifyListeners(a,null),n.push(a));return n}catch(e){return this.isClosing||jt(`Firebase Auth cross-tab polling failed with error: ${e}`),[]}}notifyListeners(e,n){this.localCache[e]=n;const r=this.listeners[e];if(r)for(const a of Array.from(r))a(n)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),ih)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,n){Object.keys(this.listeners).length===0&&(this.startPolling(),this.registerLifecycleListeners()),this.listeners[e]||(this.listeners[e]=new Set,e in this.localCache||this._get(e).catch(()=>{})),this.listeners[e].add(n)}_removeListener(e,n){this.listeners[e]&&(this.listeners[e].delete(n),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.stopPolling(),this.unregisterLifecycleListeners())}}Ds.type="LOCAL";const ah=Ds;new mt(3e4,6e4);/**
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
 */function an(i,e){return e?se(e):(S(i._popupRedirectResolver,i,"argument-error"),i._popupRedirectResolver)}/**
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
 */class hi extends Ts{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return $e(e,this._buildIdpRequest())}_linkToIdToken(e,n){return $e(e,this._buildIdpRequest(n))}_getReauthenticationResolver(e){return $e(e,this._buildIdpRequest())}_buildIdpRequest(e){const n={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(n.idToken=e),n}}function ch(i){return Wc(i.auth,new hi(i),i.bypassAuthState)}function hh(i){const{auth:e,user:n}=i;return S(n,e,"internal-error"),Vc(n,new hi(i),i.bypassAuthState)}async function lh(i){const{auth:e,user:n}=i;return S(n,e,"internal-error"),$c(n,new hi(i),i.bypassAuthState)}/**
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
 */class Ns{constructor(e,n,r,a,h=!1){this.auth=e,this.resolver=r,this.user=a,this.bypassAuthState=h,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(n)?n:[n]}execute(){return new Promise(async(e,n)=>{this.pendingPromise={resolve:e,reject:n};try{if(this.eventManager=await this.resolver._initialize(this.auth),!this.pendingPromise||(await this.onExecution(),!this.pendingPromise))return;this.eventManager.registerConsumer(this)}catch(r){this.pendingPromise&&this.reject(r)}})}async onAuthEvent(e){if(!this.pendingPromise)return;const{urlResponse:n,sessionId:r,postBody:a,tenantId:h,error:l,type:I}=e;if(l){this.reject(l);return}const v={auth:this.auth,requestUri:n,sessionId:r,tenantId:h||void 0,postBody:a||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(I)(v))}catch(T){this.reject(T)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return ch;case"linkViaPopup":case"linkViaRedirect":return lh;case"reauthViaPopup":case"reauthViaRedirect":return hh;default:te(this.auth,"internal-error")}}resolve(e){oe(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){oe(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
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
 */const uh=new mt(2e3,1e4);async function Fl(i,e,n){if(G(i.app))return Promise.reject(K(i,"operation-not-supported-in-this-environment"));const r=yt(i);ti(i,e,_t);const a=an(r,n);return new Ie(r,"signInViaPopup",e,a).executeNotNull()}async function jl(i,e,n){const r=ne(i);if(G(r.auth.app))return Promise.reject(K(r.auth,"operation-not-supported-in-this-environment"));ti(r.auth,e,_t);const a=an(r.auth,n);return new Ie(r.auth,"reauthViaPopup",e,a,r).executeNotNull()}class Ie extends Ns{constructor(e,n,r,a,h){super(e,n,a,h),this.provider=r,this.authWindow=null,this.pollId=null,Ie.currentPopupAction&&Ie.currentPopupAction.cancel(),Ie.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return S(e,this.auth,"internal-error"),e}async onExecution(){oe(this.filter.length===1,"Popup operations only handle one event");const e=ci();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(n=>{this.reject(n)}),this.resolver._isIframeWebStorageSupported(this.auth,n=>{n||this.reject(K(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(K(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,Ie.currentPopupAction=null}pollUserCancellation(){const e=()=>{var n,r;if((r=(n=this.authWindow)==null?void 0:n.window)!=null&&r.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(K(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,uh.get())};e()}}Ie.currentPopupAction=null;/**
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
 */const fh="pendingRedirect",Vt=new Map;class dh extends Ns{constructor(e,n,r=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],n,void 0,r),this.eventId=null}async execute(){let e=Vt.get(this.auth._key());if(!e){try{const r=await ph(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(r)}catch(n){e=()=>Promise.reject(n)}Vt.set(this.auth._key(),e)}return this.bypassAuthState||Vt.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const n=await this.auth._redirectUserForId(e.eventId);if(n)return this.user=n,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function ph(i,e){const n=Ls(e),r=Ms(i);if(!await r._isAvailable())return!1;const a=await r._get(n)==="true";return await r._remove(n),a}async function gh(i,e){return Ms(i)._set(Ls(e),"true")}function mh(i,e){Vt.set(i._key(),e)}function Ms(i){return se(i._redirectPersistence)}function Ls(i){return $t(fh,i.config.apiKey,i.name)}/**
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
 */function Hl(i,e,n){return yh(i,e,n)}async function yh(i,e,n){if(G(i.app))return Promise.reject(Ee(i));const r=yt(i);ti(i,e,_t),await r._initializationPromise;const a=an(r,n);return await gh(a,r),a._openRedirect(r,e,"signInViaRedirect")}async function _h(i,e,n=!1){if(G(i.app))return Promise.reject(Ee(i));const r=yt(i),a=an(r,e),l=await new dh(r,a,n).execute();return l&&!n&&(delete l.user._redirectEventId,await r._persistUserIfCurrent(l.user),await r._setRedirectUser(null,e)),l}/**
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
 */const wh=10*60*1e3;class vh{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let n=!1;return this.consumers.forEach(r=>{this.isEventForConsumer(e,r)&&(n=!0,this.sendToConsumer(e,r),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!Ih(e)||(this.hasHandledPotentialRedirect=!0,n||(this.queuedRedirectEvent=e,n=!0)),n}sendToConsumer(e,n){var r;if(e.error&&!Us(e)){const a=((r=e.error.code)==null?void 0:r.split("auth/")[1])||"internal-error";n.onError(K(this.auth,a))}else n.onAuthEvent(e)}isEventForConsumer(e,n){const r=n.eventId===null||!!e.eventId&&e.eventId===n.eventId;return n.filter.includes(e.type)&&r}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=wh&&this.cachedEventUids.clear(),this.cachedEventUids.has(Nr(e))}saveEventToCache(e){this.cachedEventUids.add(Nr(e)),this.lastProcessedEventTime=Date.now()}}function Nr(i){return[i.type,i.eventId,i.sessionId,i.tenantId].filter(e=>e).join("-")}function Us({type:i,error:e}){return i==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function Ih(i){switch(i.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Us(i);default:return!1}}/**
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
 */async function Th(i,e={}){return Ge(i,"GET","/v1/projects",e)}/**
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
 */const Eh=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,bh=/^https?/;async function Sh(i){if(i.config.emulator)return;const{authorizedDomains:e}=await Th(i);for(const n of e)try{if(Ah(n))return}catch{}te(i,"unauthorized-domain")}function Ah(i){const e=zn(),{protocol:n,hostname:r}=new URL(e);if(i.startsWith("chrome-extension://")){const l=new URL(i);return l.hostname===""&&r===""?n==="chrome-extension:"&&i.replace("chrome-extension://","")===e.replace("chrome-extension://",""):n==="chrome-extension:"&&l.hostname===r}if(!bh.test(n))return!1;if(Eh.test(i))return r===i;const a=i.replace(/\./g,"\\.");return new RegExp("^(.+\\."+a+"|"+a+")$","i").test(r)}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const Ph=new mt(3e4,6e4);function Mr(){const i=Z().___jsl;if(i!=null&&i.H){for(const e of Object.keys(i.H))if(i.H[e].r=i.H[e].r||[],i.H[e].L=i.H[e].L||[],i.H[e].r=[...i.H[e].L],i.CP)for(let n=0;n<i.CP.length;n++)i.CP[n]=null}}function kh(i){return new Promise((e,n)=>{var a,h,l;function r(){Mr(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Mr(),n(K(i,"network-request-failed"))},timeout:Ph.get()})}if((h=(a=Z().gapi)==null?void 0:a.iframes)!=null&&h.Iframe)e(gapi.iframes.getContext());else if((l=Z().gapi)!=null&&l.load)r();else{const I=Lc("iframefcb");return Z()[I]=()=>{gapi.load?r():n(K(i,"network-request-failed"))},Nc(`${Mc()}?onload=${I}`).catch(v=>n(v))}}).catch(e=>{throw Wt=null,e})}let Wt=null;function Ch(i){return Wt=Wt||kh(i),Wt}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const Rh=new mt(5e3,15e3),Oh="__/auth/iframe",Dh="emulator/auth/iframe",Nh={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},Mh=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Lh(i){const e=i.config;S(e.authDomain,i,"auth-domain-config-required");const n=e.emulator?ii(e,Dh):`https://${i.config.authDomain}/${Oh}`,r={apiKey:e.apiKey,appName:i.name,v:gt},a=Mh.get(i.config.apiHost);a&&(r.eid=a);const h=i._getFrameworks();return h.length&&(r.fw=h.join(",")),`${n}?${pt(r).slice(1)}`}async function Uh(i){const e=await Ch(i),n=Z().gapi;return S(n,i,"internal-error"),e.open({where:document.body,url:Lh(i),messageHandlersFilter:n.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Nh,dontclear:!0},r=>new Promise(async(a,h)=>{await r.restyle({setHideOnLeave:!1});const l=K(i,"network-request-failed"),I=Z().setTimeout(()=>{h(l)},Rh.get());function v(){Z().clearTimeout(I),a(r)}r.ping(v).then(v,()=>{h(l)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const xh={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Bh=500,Fh=600,jh="_blank",Hh="http://localhost";class Lr{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function $h(i,e,n,r=Bh,a=Fh){const h=Math.max((window.screen.availHeight-a)/2,0).toString(),l=Math.max((window.screen.availWidth-r)/2,0).toString();let I="";const v={...xh,width:r.toString(),height:a.toString(),top:h,left:l},T=$().toLowerCase();n&&(I=ps(T)?jh:n),fs(T)&&(e=e||Hh,v.scrollbars="yes");const P=Object.entries(v).reduce((k,[N,D])=>`${k}${N}=${D},`,"");if(Sc(T)&&I!=="_self")return Vh(e||"",I),new Lr(null);const b=window.open(e||"",I,P);S(b,i,"popup-blocked");try{b.focus()}catch{}return new Lr(b)}function Vh(i,e){const n=document.createElement("a");n.href=i,n.target=e;const r=document.createEvent("MouseEvent");r.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),n.dispatchEvent(r)}/**
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
 */const Wh="__/auth/handler",zh="emulator/auth/handler",Gh=encodeURIComponent("fac");async function Ur(i,e,n,r,a,h){S(i.config.authDomain,i,"auth-domain-config-required"),S(i.config.apiKey,i,"invalid-api-key");const l={apiKey:i.config.apiKey,appName:i.name,authType:n,redirectUrl:r,v:gt,eventId:a};if(e instanceof _t){e.setDefaultLanguage(i.languageCode),l.providerId=e.providerId||"",Mo(e.getCustomParameters())||(l.customParameters=JSON.stringify(e.getCustomParameters()));for(const[P,b]of Object.entries({}))l[P]=b}if(e instanceof wt){const P=e.getScopes().filter(b=>b!=="");P.length>0&&(l.scopes=P.join(","))}i.tenantId&&(l.tid=i.tenantId);const I=l;for(const P of Object.keys(I))I[P]===void 0&&delete I[P];const v=await i._getAppCheckToken(),T=v?`#${Gh}=${encodeURIComponent(v)}`:"";return`${Kh(i)}?${pt(I).slice(1)}${T}`}function Kh({config:i}){return i.emulator?ii(i,zh):`https://${i.authDomain}/${Wh}`}/**
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
 */const Bn="webStorageSupport";class qh{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Ps,this._completeRedirectFn=_h,this._overrideRedirectResult=mh}async _openPopup(e,n,r,a){var l;oe((l=this.eventManagers[e._key()])==null?void 0:l.manager,"_initialize() not called before _openPopup()");const h=await Ur(e,n,r,zn(),a);return $h(e,h,ci())}async _openRedirect(e,n,r,a){await this._originValidation(e);const h=await Ur(e,n,r,zn(),a);return Qc(h),new Promise(()=>{})}_initialize(e){const n=e._key();if(this.eventManagers[n]){const{manager:a,promise:h}=this.eventManagers[n];return a?Promise.resolve(a):(oe(h,"If manager is not set, promise should be"),h)}const r=this.initAndGetManager(e);return this.eventManagers[n]={promise:r},r.catch(()=>{delete this.eventManagers[n]}),r}async initAndGetManager(e){const n=await Uh(e),r=new vh(e);return n.register("authEvent",a=>(S(a==null?void 0:a.authEvent,e,"invalid-auth-event"),{status:r.onEvent(a.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:r},this.iframes[e._key()]=n,r}_isIframeWebStorageSupported(e,n){this.iframes[e._key()].send(Bn,{type:Bn},a=>{var l;const h=(l=a==null?void 0:a[0])==null?void 0:l[Bn];h!==void 0&&n(!!h),te(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const n=e._key();return this.originValidationPromises[n]||(this.originValidationPromises[n]=Sh(e)),this.originValidationPromises[n]}get _shouldInitProactively(){return ws()||ds()||oi()}}const Jh=qh;var xr="@firebase/auth",Br="1.13.11";/**
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
 */class Xh{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const n=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,n),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const n=this.internalListeners.get(e);n&&(this.internalListeners.delete(e),n(),this.updateProactiveRefresh())}assertAuthConfigured(){S(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
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
 */function Yh(i){switch(i){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function Qh(i){Le(new be("auth",(e,{options:n})=>{const r=e.getProvider("app").getImmediate(),a=e.getProvider("heartbeat"),h=e.getProvider("app-check-internal"),{apiKey:l,authDomain:I}=r.options;S(l&&!l.includes(":"),"invalid-api-key",{appName:r.name});const v={apiKey:l,authDomain:I,clientPlatform:i,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:vs(i)},T=new Oc(r,a,h,v);return xc(T,n),T},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,n,r)=>{e.getProvider("auth-internal").initialize()})),Le(new be("auth-internal",e=>{const n=yt(e.getProvider("auth").getImmediate());return(r=>new Xh(r))(n)},"PRIVATE").setInstantiationMode("EXPLICIT")),Ne(xr,Br,Yh(i)),Ne(xr,Br,"esm2020")}/**
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
 */function Zh(){var i;return((i=document.getElementsByTagName("head"))==null?void 0:i[0])??document}function el(i){return new Promise((e,n)=>{const r=document.createElement("script");try{Qa(r,i)}catch(a){n(a);return}r.onload=e,r.onerror=a=>{const h=K("internal-error");h.customData=a,n(h)},r.type="text/javascript",r.charset="UTF-8",Zh().appendChild(r)})}/**
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
 */const tl=5*60,nl=Jr("authIdTokenMaxAge")||tl;let Fr=null;const il=i=>async e=>{const n=e&&await e.getIdTokenResult(),r=n&&(new Date().getTime()-Date.parse(n.issuedAtTime))/1e3;if(r&&r>nl)return;const a=n==null?void 0:n.token;Fr!==a&&(Fr=a,await fetch(i,{method:a?"POST":"DELETE",headers:a?{Authorization:`Bearer ${a}`}:{}}))};function $l(i=Fa()){const e=ei(i,"auth");if(e.isInitialized())return e.getImmediate();const n=Uc(i,{popupRedirectResolver:Jh,persistence:[ah,Jc,Ps]}),r=Jr("authTokenSyncURL");if(r&&typeof isSecureContext=="boolean"&&isSecureContext){const h=new URL(r,location.origin);if(location.origin===h.origin){const l=il(h.toString());Gc(n,l,()=>l(n.currentUser)),zc(n,I=>l(I))}}const a=Kr("auth");return a&&Bc(n,`http://${a}`),n}Dc({loadJS:el,gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});Qh("Browser");var rl="firebase",sl="13.4.0";/**
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
 */Ne(rl,sl,"app");/**
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
 */const ol=new Map,al={activated:!1,tokenObservers:[]};function J(i){return ol.get(i)||{...al}}const jr={RETRIAL_MIN_WAIT:30*1e3,RETRIAL_MAX_WAIT:16*60*1e3};/**
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
 */class cl{constructor(e,n,r,a,h){if(this.operation=e,this.retryPolicy=n,this.getWaitDuration=r,this.lowerBound=a,this.upperBound=h,this.pending=null,this.nextErrorWaitInterval=a,a>h)throw new Error("Proactive refresh lower bound greater than upper bound!")}start(){this.nextErrorWaitInterval=this.lowerBound,this.process(!0).catch(()=>{})}stop(){this.pending&&(this.pending.reject("cancelled"),this.pending=null)}isRunning(){return!!this.pending}async process(e){this.stop();try{this.pending=new Fn,this.pending.promise.catch(n=>{}),await hl(this.getNextRun(e)),this.pending.resolve(),await this.pending.promise,this.pending=new Fn,this.pending.promise.catch(n=>{}),await this.operation(),this.pending.resolve(),await this.pending.promise,this.process(!0).catch(()=>{})}catch(n){this.retryPolicy(n)?this.process(!1).catch(()=>{}):this.stop()}}getNextRun(e){if(e)return this.nextErrorWaitInterval=this.lowerBound,this.getWaitDuration();{const n=this.nextErrorWaitInterval;return this.nextErrorWaitInterval*=2,this.nextErrorWaitInterval>this.upperBound&&(this.nextErrorWaitInterval=this.upperBound),n}}}function hl(i){return new Promise(e=>{setTimeout(e,i)})}/**
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
 */const ll={"already-initialized":"You have already called initializeAppCheck() for FirebaseApp {$appName} with different options. To avoid this error, call initializeAppCheck() with the same options as when it was originally called. This will return the already initialized instance.","use-before-activation":"App Check is being used before initializeAppCheck() is called for FirebaseApp {$appName}. Call initializeAppCheck() before instantiating other Firebase services.","fetch-network-error":"Fetch failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.","fetch-parse-error":"Fetch client could not parse response. Original error: {$originalErrorMessage}.","fetch-status-error":"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.","storage-open":"Error thrown when opening storage. Original error: {$originalErrorMessage}.","storage-get":"Error thrown when reading from storage. Original error: {$originalErrorMessage}.","storage-set":"Error thrown when writing to storage. Original error: {$originalErrorMessage}.","recaptcha-error":"ReCAPTCHA error.","initial-throttle":"{$httpStatus} error. Attempts allowed again after {$time}",throttled:"Requests throttled due to previous {$httpStatus} error. Attempts allowed again after {$time}"},en=new ze("appCheck","AppCheck",ll);function xs(i){if(!J(i).activated)throw en.create("use-before-activation",{appName:i.name})}/**
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
 */const ul="firebase-app-check-database",fl=1,Kn="firebase-app-check-store";let Ft=null;function dl(){return Ft||(Ft=new Promise((i,e)=>{try{const n=indexedDB.open(ul,fl);n.onsuccess=r=>{i(r.target.result)},n.onerror=r=>{var a;e(en.create("storage-open",{originalErrorMessage:(a=r.target.error)==null?void 0:a.message}))},n.onupgradeneeded=r=>{const a=r.target.result;switch(r.oldVersion){case 0:a.createObjectStore(Kn,{keyPath:"compositeKey"})}}}catch(n){e(en.create("storage-open",{originalErrorMessage:n==null?void 0:n.message}))}}),Ft)}function pl(i,e){return gl(ml(i),e)}async function gl(i,e){const r=(await dl()).transaction(Kn,"readwrite"),h=r.objectStore(Kn).put({compositeKey:i,value:e});return new Promise((l,I)=>{h.onsuccess=v=>{l()},r.onerror=v=>{var T;I(en.create("storage-set",{originalErrorMessage:(T=v.target.error)==null?void 0:T.message}))}})}function ml(i){return`${i.options.appId}-${i.name}`}/**
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
 */const qn=new Qn("@firebase/app-check");function Hr(i,e){return Yr()?pl(i,e).catch(n=>{qn.warn(`Failed to write token to IndexedDB. Error: ${n}`)}):Promise.resolve()}/**
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
 */const yl={error:"UNKNOWN_ERROR"};function _l(i){return Xn.encodeString(JSON.stringify(i),!1)}async function Jn(i,e=!1,n=!1){const r=i.app;xs(r);const a=J(r);let h=a.token,l;if(h&&!ht(h)&&(a.token=void 0,h=void 0),!h){const T=await a.cachedTokenPromise;T&&(ht(T)?h=T:await Hr(r,void 0))}if(!e&&h&&ht(h))return{token:h.token};let I=!1;try{a.exchangeTokenPromise||(a.exchangeTokenPromise=a.provider.getToken().finally(()=>{a.exchangeTokenPromise=void 0}),I=!0),h=await J(r).exchangeTokenPromise}catch(T){T.code==="appCheck/throttled"||T.code==="appCheck/initial-throttle"?qn.warn(T.message):n&&qn.error(T),l=T}let v;return h?l?ht(h)?v={token:h.token,internalError:l}:v=Vr(l):(v={token:h.token},a.token=h,await Hr(r,h)):v=Vr(l),I&&Tl(r,v),v}async function wl(i){const e=i.app;xs(e);const{provider:n}=J(e);{const{token:r}=await n.getToken(!0);return{token:r}}}function vl(i,e,n,r){const{app:a}=i,h=J(a),l={next:n,error:r,type:e};if(h.tokenObservers=[...h.tokenObservers,l],h.token&&ht(h.token)){const I=h.token;Promise.resolve().then(()=>{n({token:I.token}),$r(i)}).catch(()=>{})}h.cachedTokenPromise.then(()=>$r(i))}function Bs(i,e){const n=J(i),r=n.tokenObservers.filter(a=>a.next!==e);r.length===0&&n.tokenRefresher&&n.tokenRefresher.isRunning()&&n.tokenRefresher.stop(),n.tokenObservers=r}function $r(i){const{app:e}=i,n=J(e);let r=n.tokenRefresher;r||(r=Il(i),n.tokenRefresher=r),!r.isRunning()&&n.isTokenAutoRefreshEnabled&&r.start()}function Il(i){const{app:e}=i;return new cl(async()=>{const n=J(e);let r;if(n.token?r=await Jn(i,!0):r=await Jn(i),r.error)throw r.error;if(r.internalError)throw r.internalError},()=>!0,()=>{const n=J(e);if(n.token){let r=n.token.issuedAtTimeMillis+(n.token.expireTimeMillis-n.token.issuedAtTimeMillis)*.5+3e5;const a=n.token.expireTimeMillis-5*60*1e3;return r=Math.min(r,a),Math.max(0,r-Date.now())}else return 0},jr.RETRIAL_MIN_WAIT,jr.RETRIAL_MAX_WAIT)}function Tl(i,e){const n=J(i).tokenObservers;for(const r of n)try{r.type==="EXTERNAL"&&e.error!=null?r.error(e.error):r.next(e)}catch{}}function ht(i){return i.expireTimeMillis-Date.now()>0}function Vr(i){return{token:_l(yl),error:i}}/**
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
 */class El{constructor(e,n){this.app=e,this.heartbeatServiceProvider=n}_delete(){const{tokenObservers:e}=J(this.app);for(const n of e)Bs(this.app,n.next);return Promise.resolve()}}function bl(i,e){return new El(i,e)}function Sl(i){return{getToken:e=>Jn(i,e),getLimitedUseToken:()=>wl(i),addTokenListener:e=>vl(i,"INTERNAL",e),removeTokenListener:e=>Bs(i.app,e)}}const Al="@firebase/app-check",Pl="0.13.2";/**
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
 */const kl="app-check",Wr="app-check-internal";function Cl(){Le(new be(kl,i=>{const e=i.getProvider("app").getImmediate(),n=i.getProvider("heartbeat");return bl(e,n)},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((i,e,n)=>{i.getProvider(Wr).initialize()})),Le(new be(Wr,i=>{const e=i.getProvider("app-check").getImmediate();return Sl(e)},"PUBLIC").setInstantiationMode("EXPLICIT")),Ne(Al,Pl)}Cl();export{Hl as A,Ul as B,be as C,jl as D,oc as E,Se as F,_e as G,Bl as H,Za as I,Qn as L,ec as M,sc as S,nc as W,tc as X,G as _,R as a,ei as b,Ol as c,Ve as d,Dl as e,ac as f,Fa as g,ic as h,Yn as i,rc as j,cc as k,Nl as l,$ as m,To as n,Yr as o,Bo as p,Ml as q,ne as r,Ll as s,Le as t,Ne as u,gt as v,Ba as w,$l as x,xl as y,Fl as z};
