lo(function(){function DefineProperty(e,t,n){Object.defineProperty(e,t,n)}function DefineGetSet(e,t,n,i){DefineProperty(e,t,{set:i,get:n})}function DefineElementProto(e,t){Object.defineProperty(elementProto,e,{value:t})}function CheckPassCode(e){return e.$passCode$=passCode,e.$passCode$!==passCodeSub}function StringSynchronized(el,pr,data){if("number"==typeof data)return data;if("string"==typeof data&&!data.match(/\{|\}|function/gi)){data=data.replace(/\]w/gi,"].offsetWidth"),data=data.replace(/\]h/gi,"].offsetHeight"),data=data.replace(/\]x/gi,"].offsetLeft"),data=data.replace(/\]y/gi,"].offsetTop"),data=data.replace(/\]\$w/gi,"].$width"),data=data.replace(/\]\$h/gi,"].$height"),data=data.replace(/\]\$x/gi,"].$x"),data=data.replace(/\]\$y/gi,"].$y");var el=el||{},pr=pr||{},w=el.offsetWidth||0,h=el.offsetHeight||0,x=el.offsetLeft||0,y=el.offsetTop||0,pw=pr.offsetWidth||0,ph=pr.offsetHeight||0,px=pr.offsetLeft||0,py=pr.offsetTop||0,scrw=el.scrollWidth||0,scrh=el.scrollHeight||0,scrx=el.scrollLeft||0,scry=el.scrollTop||0,pscrw=pr.scrollWidth||0,pscrh=pr.scrollHeight||0,pscrx=pr.scrollLeft||0,pscry=pr.scrollTop||0,ww=window.innerWidth||0,wh=window.innerHeight||0,pcn=pr.childNodes,result=null;return result=eval(data),"number"==typeof result?result:0}return null}function ModelCssAndAttr(e,t,n,i,o,r,f){if("object"==typeof t){if(Array.isArray(t))return o(e,t.length,[]);i(e)}else if("string"==typeof t){if(void 0===n)return f(e);r(e)}return e}function CssChange(e,t,n){return ModelCssAndAttr(e,t,n,function(e){for(var n in t)if(n.match(/left|top|width|height|fontSize/gi)){var i=t[n];"string"==typeof i&&i.match(/\%|px$|pt$/gi)?e.style[n]=t[n]:e.style[n]=t[n]+"px"}else e.style[n]=t[n]},function(e,t,n){for(var i=0;i<t;i++)n.push(e.style[propertyName]);return n},function(e){t.match(/left|top|width|height|fontSize/gi)?"string"==typeof n&&n.match(/px$|pt$/gi)?e.style[t]=n:e.style[t]=n+"px":e.style[t]=n},function(e){return e.style[t]})}function AttrChange(e,t,n){return ModelCssAndAttr(e,t,n,function(e){for(var n in t)e.setAttribute(n,t[n])},function(e,n,i){for(var o=0;o<n;o++)i.push(e.getAttribute(t[o]));return i},function(e){e.setAttribute(t,n)},function(e){return e.getAttribute(t)})}function PinTypeChange(e,t,n,i){var o=t.split("-");o.length;switch(e.$pinLock$=passCode,o[0]){case"left":e.$xPinType="left";break;case"center":e.$xPinType="center";break;case"right":e.$xPinType="right";break;default:e.$xPinType="left"}switch(o[1]){case"top":e.$yPinType="top";break;case"middle":e.$yPinType="middle";break;case"bottom":e.$yPinType="bottom";break;default:e.$yPinType="top"}return e.$overX="number"==typeof n?n:0,e.$overY="number"==typeof i?i:0,e.$pinLock$,e}function DefineCDOMObject(e){if(!CheckPassCode(e))return!1;var t=!1,n=!1,i={},o="left",r=0,f="top",s=0,c=0,a=0,l=5e3,u=1,p=[],h=0,d={},g={},y={},m=1,$=[],v=0,b={},C={},D={};DefineGetSet(e,"$passCode$",function(){if(t)return t=!1,passCodeSub},function(e){e===passCode&&(t=!0)}),DefineGetSet(e,"$imgLoadTimeout",function(){return l},function(e){"number"==typeof e&&(l=e)}),DefineGetSet(e,"$pinLock$",function(){n&&(n=!1)},function(e){e===passCode&&(n=!0)}),DefineGetSet(e,"$isCDOM",function(){return!0}),DefineGetSet(e,"$store",function(){return i}),DefineGetSet(e,"$xPinType",function(){return o},function(t){if(n){var i=e.$x;switch(o=t){case"left":r=0;break;case"center":r=.5;break;case"right":r=1}e.$x=i}}),DefineGetSet(e,"$yPinType",function(){return f},function(t){if(n){var i=e.$y;switch(f=t){case"top":s=0;break;case"middle":s=.5;break;case"bottom":s=1}e.$y=i}}),DefineGetSet(e,"$overX",function(){return c},function(e){t&&"number"==typeof e&&(c=e)}),DefineGetSet(e,"$overY",function(){return a},function(e){t&&"number"==typeof e&&(a=e)}),DefineGetSet(e,"$left",function(){return e.offsetLeft},function(e){}),DefineGetSet(e,"$right",function(){return e.offsetLeft+e.offsetWidth},function(e){}),DefineGetSet(e,"$top",function(){return e.offsetTop},function(e){}),DefineGetSet(e,"$bottom",function(){return e.offsetTop+e.offsetHeight},function(e){}),DefineGetSet(e,"$x",function(){return e.offsetLeft+e.offsetWidth*r},function(t){var n=e.offsetWidth*r,i=e.offsetLeft+n,o=StringSynchronized(e,e.parentNode,t);e.style.left=o-n+"px";for(var f=0;f<v;f++)D[C[$[f]]]("x",i,o)}),DefineGetSet(e,"$y",function(){return e.offsetTop+e.offsetHeight*s},function(t){var n=e.offsetHeight*s,i=e.offsetTop+n,o=StringSynchronized(e,e.parentNode,t);e.style.top=o-n+"px";for(var r=0;r<v;r++)D[C[$[r]]]("y",i,o)}),DefineGetSet(e,"$width",function(){return e.offsetWidth},function(t){var n=e.style,i=e.offsetWidth,o=StringSynchronized(e,e.parentNode,t),f=e.offsetLeft-(o-i)*r;n.width=o+"px",n.left=f+"px";for(var s=0;s<h;s++)y[g[p[s]]]("width",i,o)}),DefineGetSet(e,"$height",function(){return e.offsetHeight},function(t){var n=e.style,i=e.offsetHeight,o=StringSynchronized(e,e.parentNode,t),r=e.offsetTop-(o-e.offsetHeight)*s;n.height=o+"px",n.top=r+"px";for(var f=0;f<h;f++)y[g[p[f]]]("height",i,o)}),DefineGetSet(e,"$resize",function(){return function(e,t){return"string"!=typeof e||d[e]||y[e]||("function"==typeof t&&(g[u]=e,d[e]=u,y[e]=t,p=Object.keys(g),h=p.length,u++),null===typeof t&&(delete g[d[e]],delete d[e],delete y[e],p=Object.keys(g),h=p.length)),this}}),DefineGetSet(e,"$repos",function(){return function(e,t){return"string"==typeof e&&("function"==typeof t&&(C[m]=e,b[e]=m,D[e]=t,$=Object.keys(C),v=$.length,m++),null===typeof t&&(delete C[b[e]],delete b[e],delete D[e],$=Object.keys(C),v=$.length)),this}})}if(!Object||!Object.defineProperty)return!1;var passCode=Math.random(),passCodeSub=Math.random();if(Element){var elementProto=Element.prototype;DefineElementProto("$attr",function(e,t){return CheckPassCode(this)?this:AttrChange(this,e,t)}),DefineElementProto("$css",function(e,t){return CheckPassCode(this)?this:CssChange(this,e,t)}),DefineElementProto("$abs",function(){return CheckPassCode(this)?this:CssChange(this,"position","absolute")}),DefineElementProto("$zIndex",function(e){return CheckPassCode(this)?this:CssChange(this,"zIndex","number"==typeof e?e:"auto")}),DefineElementProto("$setPinType",function(e,t,n){return CheckPassCode(this)||"string"!=typeof e?this:PinTypeChange(this,e,t,n)}),DefineElementProto("$setX",function(e){return this.$x=e,this}),DefineElementProto("$setY",function(e){return this.$y=e,this}),DefineElementProto("$setWidth",function(e){return this.$width=e,this}),DefineElementProto("$setHeight",function(e){return this.$height=e,this}),DefineElementProto("$setMouseEventData",function(e,t,n){return CheckPassCode(this)?this:(e&&t&&n&&"object"==typeof n?(n.type=e,n.id=t,this.$$mouseEventData=n):console.log("err"),this)}),DefineElementProto("$append",function(){var e=this;return function t(n){if(n&&"object"==typeof n)if(n.nodeType)e.appendChild(n);else if(n.length)for(var i=n.length,o=0;o<i;o++)t(n[o])}(arguments),this}),DefineElementProto("$prepend",function(e,t){var n=this,i=n.childNodes.length-1;return function e(o){if(o&&"object"==typeof o)if(o.nodeType)t&&"number"==typeof t?n.insertBefore(o,n.childNodes[t]):t&&"object"==typeof t&&t.nodeType?n.insertBefore(o,t):n.insertBefore(o,n.firstChild);else if(o.length){var r=o.length-1;if(t&&"number"==typeof t&&t>=i)n.$append(o);else if(t&&"object"==typeof t&&t.nodeType)for(f=0;f<=r;f++)e(o[f]);else for(var f=r;f>=0;f--)e(o[f])}}(e),this}),DefineElementProto("$removeChild",function(){var e=this,t=arguments,n=e.childNodes;if(t.length)!function t(n){if("object"==typeof n)if(n.length)for(var i=n.length-1;i>-1;i--)t(n[i]);else n.nodeType&&e.removeChild(n)}(t);else for(var i=n.length-1;i>=0;i--)e.removeChild(n[i]);return this}),DefineElementProto("$remove",function(){var e=this,t=e.parentNode;return t&&t.removeChild(e),this}),DefineElementProto("$innerHTML",function(e){return this.innerHTML=e,this});var rootObj=function(e,t){var n=null,i=!1,o=0;if("string"==typeof e?"body"===e?n=document.body||document.getElementsByTagName("body")[0]:"text"===e?n=document.createTextNode(t):e.match(/^\#/gi)?n=document.getElementById(e.replace(/^\./gi,"")):e.match(/^\./gi)?(i=!0,o=(n=document.getElementsByClassName(e.replace(/^\#/gi,""))).length):n=document.createElement(e||"div"):"object"==typeof e&&(n=e),i)for(var r=0;r<o;r++)DefineCDOMObject(n[r]);else DefineCDOMObject(n);return n};return lo().addPlugin("cdom",rootObj),!0}lo().addPlugin("cdom",function(){console.log("can not Call pulgin - cdom")})}),lo(function(e,t,n){var i=n.cdom,o=function(e,t){if("string"==typeof e){var n=e.replace(/(^\s+)|(\s+$)|\n/gim,"").replace(/(<\^.*?>)/g,"\n$1").replace(/(<\^.*?>)(?=.+)/g,"$1\n").split(/\n/gm),o=n.length,r=new i("div"),f=[{dom:r,toss:{}}],s=[];return f.lastIndex=function(){return this.length-1},f.lastDom=function(){return this[this.lastIndex()].dom},f.lastToss=function(){return this[this.lastIndex()].toss},t&&t.appendChild&&t.appendChild(r),function e(t,r){if(o<=t)return!1;var s=n[t],c=null;if(s.match(/^<\^>/))f.pop();else if(s.match(RegExp("^<\\^(?=div|p)"))){var a=s.replace(/^<\^|>$/g,"").split(/ (?=cs|css|atr|ccss|catr\{)/gi),l=a?a.length:0,u=null,p=null,h={css:{},atr:{}};!function e(t){if(l<=t)return!1;var n=a[t],o=n.match(/^div|p|css|atr|ccss|catr/i),r=o?o[0]:"";if(r.match(RegExp("div|p"))){c=new i(r);var f=n.replace(/^.*?(?=[\#\.])/i,"");u=f.replace(/^\..*?(?=\#)|\..*/g,"").split("#")[1],p=f.replace(/^\#.*?(?=\.)|\#.*/g,"").split(".")[1]}else if(r.match(/css|atr|ccss|catr/i)){var s=n.match(/\{.*?\}/i);if(s=s?s[0].replace(/[\{\}]/gi,"").replace(/;$/,""):""){var d=s.split(/[:;]/),g=d.length,y=null;r.match(/css|atr/i)&&(y=h[r]),function e(t,n){g>t&&(n?(y[n]=d[t],e(t+1)):e(t+1,d[t]),0===n||1===n&&e(t+1,0))}(0)}}else r.match(/cs/i);e(t+1)}(0),c&&(f.lastDom().$append(c),f.push({dom:c,toss:{}}),u&&(c.id=u),p&&c.classList.add(p),c.$attr(h.atr),c.$css(h.css))}else f.lastDom().$append(new i("text",s));e(t+1)}(0),{dom:r,list:s}}};lo().addPlugin("ctemplate",o)});