lo(function(){

    /* 정의 함수가 존재 하지않으면 동작 안한다. 익스 9이상의 버전에서만 지원함 */
    if(!Object || !Object.defineProperty){
        return false;
    }

    // Object.defineProperty(obj, 'prop', {
    //     value: value,
    //     writable: false,
    //     configurable: false,
    //     enumerable: false,
    //     get : function(value){return 0},
    //     set : function(){return 0}
    // });

    /* #1 */
    var passCode = Math.random(), passCodeSub = Math.random(); // 랜덤 암호 코드

    if(Element){

        // 프로토타입 체인 구성 하기
        var elementProto = Element.prototype;

        // 다중 속성 변경
        DefineElementProto('$attr', function(item1, item2){
            if(CheckPassCode(this)){return this;}
            return AttrChange(this, item1, item2);
        });

        // 다중 스타일시트 변경
        DefineElementProto('$css', function(item1, item2){
            if(CheckPassCode(this)){return this;}
            return CssChange(this, item1, item2);
        });

        DefineElementProto('$abs', function(){
            if(CheckPassCode(this)){return this;}
            // return this;
            return CssChange(this, 'position', 'absolute');
        });

        DefineElementProto('$zIndex', function(value){
            if(CheckPassCode(this)){return this;}
            // return this;
            return CssChange(this, 'zIndex', typeof value === 'number' ? value : 'auto');
        });

        /* 좌표계 */

        // 좌표의 시작 레이아웃 위치
        DefineElementProto('$setPinType', function(pinType, overX, overY){
            if(CheckPassCode(this) || typeof pinType !== 'string'){return this;}
            return PinTypeChange(this, pinType, overX, overY);
        });

        // x 좌표 변경
        DefineElementProto('$setX', function(value){
            this.$x = value;
            return this;
        });

        //  좌표 변경
        DefineElementProto('$setY', function(value){
            this.$y = value;
            return this;
        });

        // 가로 크기 변경
        DefineElementProto('$setWidth', function(value){
            this.$width = value;
            return this;
        });

        // 세로 크기 변경
        DefineElementProto('$setHeight', function(value){
            this.$height = value;
            return this;
        });

        // 마우스 이벤트 설정
        DefineElementProto('$setMouseEventData', function(type, id, eventData){
            if(CheckPassCode(this)){return this;}
            if(type && id && eventData && typeof eventData === 'object'){
                eventData.type = type;
                eventData.id = id;
                this.$$mouseEventData = eventData;
            }else{
                console.log('err');
            }
            return this;
        });

        // 자식 추가 (뒤로)
        DefineElementProto('$append', function(){
            var self = this, arg = arguments;

            (function loop(item){
                if(item && typeof item === 'object'){
                    if(item.nodeType){
                        self.appendChild(item);
                    }else if(item.length){
                        var maxLength = item.length;
                        for(var i=0; i<maxLength; i++){
                            loop(item[i]);
                        }
                    }
                }
            })(arg);

            return this;
        });

        // 자식 추가 (앞으로)
        DefineElementProto('$prepend', function(nodes, targetNode){
            var self = this, lastTartgetIndex = self.childNodes.length-1;

            (function loop(item){
                if(item && typeof item === 'object'){
                    if(item.nodeType){
                        if(targetNode && typeof targetNode === 'number'){
                            self.insertBefore(item, self.childNodes[targetNode]);
                        }else if(targetNode && typeof targetNode === 'object' && targetNode.nodeType){
                            self.insertBefore(item, targetNode);
                        }else{
                            self.insertBefore(item, self.firstChild);
                        }
                    }else if(item.length){
                        var lastIndex = item.length-1;
                        if( targetNode && typeof targetNode === 'number' && (targetNode >= lastTartgetIndex) ){
                            // 마지막 인덱스 이상
                            self.$append(item);
                        }else if(targetNode && typeof targetNode === 'object' && targetNode.nodeType){
                            for(var i=0; i<=lastIndex; i++){ // 순서대로
                                loop(item[i]);
                            }
                        }else{
                            for(var i=lastIndex; i>=0; i--){ // 뒤에서 부터
                                loop(item[i]);
                            }
                        }
                    }
                }
            })(nodes);

            return this;
        });

        // 모든 자식 삭제
        DefineElementProto('$removeChild', function(){
            var self = this,
            args = arguments,
            childNodes = self.childNodes;

            if(args.length){
                (function loop(item){
                    if(typeof item === 'object'){
                        if(item.length){
                            for(var i = item.length-1; i>-1; i--){
                                loop(item[i]);
                            }
                        }else if(item.nodeType){
                            self.removeChild(item);
                        }
                    }
                })(args);
            }else{
                for(var i=childNodes.length-1; i>=0; i--){
                    self.removeChild(childNodes[i]);
                }
            }
            return this;
        });

        // 자기 자신을 부모 노드로부터 삭제
        DefineElementProto('$remove', function(){
            var self = this, parentNode = self.parentNode;
            if(parentNode){
                parentNode.removeChild(self);
            }
            return this;
        });

        DefineElementProto('$innerHTML', function(text){
            var self = this;
            self.innerHTML = text;
            return this;
        });

        // DefineElementProto('$resize', function(){
        //     return this;
        // });

        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /* #2 재사용 함수 정의 */

        // 프로퍼티 기본 정의
        function DefineProperty(obj, prop, datas){
            Object.defineProperty(obj, prop, datas);
        }

        // 프로퍼티 겟 셋 기본 정의
        function DefineGetSet(obj, prop, getFn, setFn){
            DefineProperty(obj, prop, {
                set : setFn,
                get : getFn
            })
        }

        // dom 프로토타입 기본 정의
        function DefineElementProto(prop, actionFn){
            Object.defineProperty(elementProto, prop, {
                value : actionFn
            });
        }

        /* 패스코드 체크 */
        function CheckPassCode(selfNode){
            selfNode.$passCode$ = passCode;
            if(selfNode.$passCode$ === passCodeSub){
                return false;
            }
            return true;
        }

        /* 스트링 아날라이즈 */
        function StringSynchronized(el, pr, data){
            if(typeof data === 'number'){
                return data;
            }else if(typeof data === 'string' && !data.match(/\{|\}|function/gi)){
                // pcn[3]w
                data = data.replace(/\]w/gi, '].offsetWidth');
                data = data.replace(/\]h/gi, '].offsetHeight');
                data = data.replace(/\]x/gi, '].offsetLeft');
                data = data.replace(/\]y/gi, '].offsetTop');

                data = data.replace(/\]\$w/gi, '].$width');
                data = data.replace(/\]\$h/gi, '].$height');
                data = data.replace(/\]\$x/gi, '].$x');
                data = data.replace(/\]\$y/gi, '].$y');

                var el = el || {}, pr = pr || {},
                w = el.offsetWidth || 0, h = el.offsetHeight || 0,
                x = el.offsetLeft || 0, y = el.offsetTop || 0,
                pw = pr.offsetWidth || 0, ph = pr.offsetHeight || 0,
                px = pr.offsetLeft || 0, py = pr.offsetTop || 0,
                scrw = el.scrollWidth || 0, scrh = el.scrollHeight || 0,
                scrx = el.scrollLeft || 0, scry = el.scrollTop || 0,
                pscrw = pr.scrollWidth || 0, pscrh = pr.scrollHeight || 0,
                pscrx = pr.scrollLeft || 0, pscry = pr.scrollTop || 0,
                ww = window.innerWidth || 0, wh = window.innerHeight || 0,
                pcn = pr.childNodes,
                result = null;

                result = eval(data);
                //&& !data.match(/\%/gi)
                return typeof result === 'number' ? result : 0;
            }
            return null;
        }

        /* 오브젝트와 스트링 체크, (스타일시트, 속성에 적용) */
        function ModelCssAndAttr(selfNode, item1, item2, isObjectFn, isArrayFn, isStringFn, isUdefindedFn){

            if(typeof item1 === 'object'){
                if(Array.isArray(item1)){
                    return isArrayFn(selfNode, item1.length, []);
                }else{
                    isObjectFn(selfNode);
                }
            }else if(typeof item1 === 'string'){
                if(item2 === undefined){
                    return isUdefindedFn(selfNode);
                }else{
                    isStringFn(selfNode);
                }
            }
            return selfNode;
        }

        // css 변경
        function CssChange(selfNode, item1, item2){
            return ModelCssAndAttr(selfNode, item1, item2, function(selfNode){
                for(var propertyName in item1){
                    if(propertyName.match(/left|top|width|height|fontSize/gi)){
                        var item = item1[propertyName];
                        if(typeof item === 'string' && item.match(/\%|px$|pt$/gi)){
                            selfNode.style[propertyName] = item1[propertyName];
                        }else{
                            selfNode.style[propertyName] = item1[propertyName] + 'px';
                        }
                    }else{
                        selfNode.style[propertyName] = item1[propertyName];
                    }
                }
            }, function(selfNode, maxLength, result){
                for(var i=0; i<maxLength; i++){
                    result.push(selfNode.style[propertyName]);
                }
                return result;
            }, function(selfNode){
                if(item1.match(/left|top|width|height|fontSize/gi)){
                    if(typeof item2 === 'string' && item2.match(/px$|pt$/gi)){
                        selfNode.style[item1] = item2;
                    }else{
                        selfNode.style[item1] = item2 + 'px';
                    }
                }else{
                    selfNode.style[item1] = item2;
                }
            }, function(selfNode){
                return selfNode.style[item1];
            });
        }

        // 속성 변경
        function AttrChange(selfNode, item1, item2){
            return ModelCssAndAttr(selfNode, item1, item2, function(selfNode){
                for(var propertyName in item1){
                    selfNode.setAttribute(propertyName, item1[propertyName]);
                }
            }, function(selfNode, maxLength, result){
                for(var i=0; i<maxLength; i++){
                    result.push(selfNode.getAttribute(item1[i]));
                }
                return result;
            }, function(selfNode){
                selfNode.setAttribute(item1, item2);
            }, function(selfNode){
                return selfNode.getAttribute(item1);
            });
        }

        // 좌표 방향 변경
        function PinTypeChange(selfNode, pinType, overX, overY){
            // ('left-top', 0, 0) -> 바닐라 타입
            // 좌표 0이
            // pinType : left, center, right, top, middle, bottom
            var pinData = pinType.split('-'),dataLength = pinData.length;

            selfNode.$pinLock$ = passCode;
            switch (pinData[0]) {
                case 'left' : {
                    selfNode.$xPinType = 'left';
                    break;
                }
                case 'center' : {
                    selfNode.$xPinType = 'center';
                    break;
                }
                case 'right' : {
                    selfNode.$xPinType = 'right';
                    break;
                }
                default : {
                    selfNode.$xPinType = 'left';
                }
            }
            switch (pinData[1]) {
                case 'top' : {
                    selfNode.$yPinType = 'top';
                    break;
                }
                case 'middle' : {
                    selfNode.$yPinType = 'middle';
                    break;
                }
                case 'bottom' : {
                    selfNode.$yPinType = 'bottom';
                    break;
                }
                default : {
                    selfNode.$yPinType = 'top';
                }
            }

            selfNode.$overX = typeof overX === 'number' ? overX : 0;
            selfNode.$overY = typeof overY === 'number' ? overY : 0;


            selfNode.$pinLock$;

            return selfNode;
        }


        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /*---------------------------------------------------------------------------------------------------*/
        /* #3 반환 함수 정의 */

        var rootObj = function(domType, option){
            // dom 생성
            var domObj = null, isClass = false, classLength = 0;

            if(typeof domType === 'string'){
                if(domType === 'body'){
                    domObj = document.body || document.getElementsByTagName('body')[0];
                }else if(domType === 'text'){
                    domObj = document.createTextNode(option);
                }else if(domType.match(/^\#/gi)){ // Id
                    domObj = document.getElementById(domType.replace(/^\./gi, ''));
                }else if(domType.match(/^\./gi)){ // Class
                    domObj = document.getElementsByClassName(domType.replace(/^\#/gi, ''));
                    isClass = true;
                    classLength = domObj.length;
                }else{
                    domObj = document.createElement(domType || 'div');
                }
            }else if(typeof domType === 'object'){
                domObj = domType;
            }

            if(isClass){ // 클래스 이면
                for(var i = 0; i<classLength; i++){
                    DefineCDOMObject(domObj[i]);
                }
            }else{
                DefineCDOMObject(domObj);
            }

            return domObj;
        };

        /* CDOM 의 정의 */
        function DefineCDOMObject(domObj){
            if(!CheckPassCode(domObj)){return false;}

            var lock = false, pinLock = false,
            store = {},
            xPinType = 'left', xPinMargin = 0, pinX = 0,
            yPinType = 'top', yPinMargin = 0, pinY = 0,
            overX = 0, overY = 0, // pin 오버 좌표
            domX = 0, domY = 0, domWidth = 0, domHeight = 0,
            imgLoadTimeout = 5000,
            resize_stack_count = 1,
            resize_count_list = [],
            resize_count_listLength = 0,
            resize_stack_list = {},
            resize_index_list = {},
            resize_function_list = {},
            repos_stack_count = 1,
            repos_count_list = [],
            repos_count_listLength = 0,
            repos_stack_list = {},
            repos_index_list = {},
            repos_function_list = {};

            // 패스코드 출력기
            DefineGetSet(domObj, '$passCode$', function(){
                if(lock){ // 락이 해제되면 두번째 서브암호를 반환
                    lock = false;
                    return passCodeSub;
                }
            }, function(value){
                if(value === passCode){// 메인 암호를 대조
                    lock = true; // 맞으면 락 해제
                }
            });

            DefineGetSet(domObj, '$imgLoadTimeout', function(){
                return imgLoadTimeout;
            }, function(value){
                if(typeof value === 'number'){
                    imgLoadTimeout = value;
                }
            });

            DefineGetSet(domObj, '$pinLock$', function(){
                if(pinLock){ // 락이 해제되면 두번째 서브암호를 반환
                    pinLock = false;
                }
            }, function(value){
                if(value === passCode){// 메인 암호를 대조
                    pinLock = true; // 맞으면 락 해제
                }
            });

            // CDOM 객체 인가
            DefineGetSet(domObj, '$isCDOM', function(){
                return true;
            });

            // 저장소 ( 공유 데이터 입력 가능 )
            DefineGetSet(domObj, '$store', function(){
                return store;
            });

            //x의 핀 좌표
            DefineGetSet(domObj, '$xPinType', function(){
                return xPinType;
            }, function(value){
                if(pinLock){
                    var oldPoint = domObj.$x;
                    xPinType = value;
                    switch (xPinType) {
                        case 'left' : {
                            xPinMargin = 0;
                            break;
                        }
                        case 'center' : {
                            xPinMargin = 0.5;
                            break;
                        }
                        case 'right' : {
                            xPinMargin = 1;
                            break;
                        }
                    }
                    domObj.$x = oldPoint;
                }
            });

            //y의 핀 좌표
            DefineGetSet(domObj, '$yPinType', function(){
                return yPinType;
            }, function(value){
                if(pinLock){
                    var oldPoint = domObj.$y;
                    yPinType = value;
                    switch (yPinType) {
                        case 'top' : {
                            yPinMargin = 0;
                            break;
                        }
                        case 'middle' : {
                            yPinMargin = 0.5;
                            break;
                        }
                        case 'bottom' : {
                            yPinMargin = 1;
                            break;
                        }
                    }
                    domObj.$y = oldPoint;
                }
            });

            DefineGetSet(domObj, '$overX', function(){
                return overX;
            }, function(value){
                if(lock && typeof value === 'number'){
                    overX = value;
                }
            });

            DefineGetSet(domObj, '$overY', function(){
                return overY;
            }, function(value){
                if(lock && typeof value === 'number'){
                    overY = value;
                }
            });

            /* 좌표계 */

            // domObj.offsetLeft 와 동일
            DefineGetSet(domObj, '$left', function(){
                return domObj.offsetLeft;
            }, function(value){});

            DefineGetSet(domObj, '$right', function(){
                return domObj.offsetLeft + domObj.offsetWidth;
            }, function(value){});

            DefineGetSet(domObj, '$top', function(){
                return domObj.offsetTop;
            }, function(value){});

            DefineGetSet(domObj, '$bottom', function(){
                return domObj.offsetTop + domObj.offsetHeight;
            }, function(value){});

            // x 좌표 ( 여기서 x 좌표는 left 좌표를 뜻하는게 아닐수 있음)
            DefineGetSet(domObj, '$x', function(){
                // console.log(domObj.offsetWidth*xPinMargin);
                return domObj.offsetLeft + (domObj.offsetWidth*xPinMargin);
            }, function(value){
                var margin = domObj.offsetWidth*xPinMargin,
                oldValue = domObj.offsetLeft + margin,
                result = StringSynchronized(domObj, domObj.parentNode, value); // 스트링 변환
                domObj.style.left = (result - margin) + 'px';

                for(var i = 0; i<repos_count_listLength; i++){
                    repos_function_list[repos_index_list[repos_count_list[i]]]('x', oldValue, result);
                }
            });

            // y 좌표 ( 여기서 y 좌표는 top 좌표를 뜻하는게 아닐수 있음)
            DefineGetSet(domObj, '$y', function(){
                return domObj.offsetTop + (domObj.offsetHeight*yPinMargin);
            }, function(value){
                var margin = domObj.offsetHeight*yPinMargin,
                oldValue = domObj.offsetTop + margin,
                result = StringSynchronized(domObj, domObj.parentNode, value); // 스트링 변환
                domObj.style.top = (result - margin) + 'px';

                for(var i = 0; i<repos_count_listLength; i++){
                    repos_function_list[repos_index_list[repos_count_list[i]]]('y', oldValue, result);
                }
            });

            /* 사이즈계 */
            DefineGetSet(domObj, '$width', function(){
                return domObj.offsetWidth;
            }, function(value){
                var domStyle = domObj.style,
                oldValue = domObj.offsetWidth,
                result = StringSynchronized(domObj, domObj.parentNode, value),
                changePinPoint = domObj.offsetLeft - ((result- oldValue)*xPinMargin);


                domStyle.width = result + 'px';
                domStyle.left = changePinPoint + 'px';


                for(var i = 0; i<resize_count_listLength; i++){
                    resize_function_list[resize_index_list[resize_count_list[i]]]('width', oldValue, result);
                }
            });

            DefineGetSet(domObj, '$height', function(){
                return domObj.offsetHeight;
            }, function(value){
                var domStyle = domObj.style,
                oldValue = domObj.offsetHeight,
                result = StringSynchronized(domObj, domObj.parentNode, value),
                changePinPoint = domObj.offsetTop - ((result - domObj.offsetHeight)*yPinMargin);

                domStyle.height = result + 'px';
                domStyle.top = changePinPoint + 'px';

                for(var i = 0; i<resize_count_listLength; i++){
                    resize_function_list[resize_index_list[resize_count_list[i]]]('height', oldValue, result);
                }
            });

            // 사이즈 주시
            DefineGetSet(domObj, '$resize', function(){
                return function(resizeId, fn){
                    if(typeof resizeId === 'string' && !resize_stack_list[resizeId] && !resize_function_list[resizeId]){
                        if(typeof fn === 'function'){
                            resize_index_list[resize_stack_count] = resizeId;
                            resize_stack_list[resizeId] = resize_stack_count;
                            resize_function_list[resizeId] = fn;
                            resize_count_list = Object.keys(resize_index_list);
                            resize_count_listLength = resize_count_list.length;
                            resize_stack_count++;
                        }if(typeof fn === null){
                            delete resize_index_list[resize_stack_list[resizeId]];
                            delete resize_stack_list[resizeId];
                            delete resize_function_list[resizeId];
                            resize_count_list = Object.keys(resize_index_list);
                            resize_count_listLength = resize_count_list.length;
                        }
                    }
                    return this;
                };
            });

            // 좌표 주시
            DefineGetSet(domObj, '$repos', function(){
                return function(reposId, fn){
                    if(typeof reposId === 'string'){
                        if(typeof fn === 'function'){
                            repos_index_list[repos_stack_count] = reposId;
                            repos_stack_list[reposId] = repos_stack_count;
                            repos_function_list[reposId] = fn;
                            repos_count_list = Object.keys(repos_index_list);
                            repos_count_listLength = repos_count_list.length;
                            repos_stack_count++;
                        }if(typeof fn === null){
                            delete repos_index_list[repos_stack_list[reposId]];
                            delete repos_stack_list[reposId];
                            delete repos_function_list[reposId];
                            repos_count_list = Object.keys(repos_index_list);
                            repos_count_listLength = repos_count_list.length;
                        }
                    }
                    return this;
                };
            });

        }

        lo().addPlugin('cdom', rootObj);


        return true;
    }


    lo().addPlugin('cdom', function(){
        console.log('can not Call pulgin - cdom');
    });

});

/* 템플릿  */
lo(function(side_lo, appMgrList, plugin){

    var p_cdom = plugin.cdom,
    g_check_block_type = 'div|p',
    masterObj = function(templateData, parent_node){
        if(typeof templateData === 'string'){
            // var pro_templateData = templateData.replace(/(^\s+)/gim, ''),
            var pro_templateData = templateData.replace(/(^\s+)|(\s+$)|\n/gim, ''),
            ct_list = pro_templateData.replace(/(<\^.*?>)/g, '\n$1').replace(/(<\^.*?>)(?=.+)/g, '$1\n').split(/\n/gm),
            ct_list_len = ct_list.length,
            dom_box = new p_cdom('div'), // 마스터 dom
            history_dom_depth = [
                {dom : dom_box, toss : {}}
            ], // 뎁스 히스토리
            enter_count = 0,
            result = [];

            // 마지막 인덱스 반환 로직
            history_dom_depth.lastIndex = function(){
                return this.length-1;
            };

            // 마지막 dom 반환
            history_dom_depth.lastDom = function(){
                return this[this.lastIndex()].dom;
            };

            // 마지막 toss 반환
            history_dom_depth.lastToss = function(){
                return this[this.lastIndex()].toss;
            };

            // 부모 node(dom)이 존재 할 경우 dom_box를 추가 해준다.
            if(parent_node && parent_node.appendChild){
                parent_node.appendChild(dom_box);
            }

            // console.log(pro_templateData);
            // console.log(ct_list);

            /* dom 구조 생성
                - 문자열을 <^.> 기준으로 split 하여 배열로 쪼갬
                - 쪼갠 배열을 순차적으로 분석하여 dom 구조를 완성한다.
                - depth history 와 <^.>에 대한 예외 처리가 잘 되어야 한다.
            */
            (function ct_list_loop(i_count, p_node){
                if(ct_list_len <= i_count){return false;}

                var data = ct_list[i_count],
                r_text = null,
                r_dom = null; //결과 HTML DOM

                if(data.match(/^<\^>/)){ // form end
                    // console.log('form end');
                    history_dom_depth.pop(); // 마지막 히스토리 삭제
                }else if(data.match( RegExp('^<\\^(?=' + g_check_block_type + ')') )){ // form start
                    // console.log('form start');
                    var block_match = data.replace(/^<\^|>$/g, '').split(/ (?=cs|css|atr|ccss|catr\{)/gi),
                    block_match_len = block_match ? block_match.length : 0,
                    dom_id = null, dom_class = null,
                    r_set_obj = {
                        css : {}, // 결과 css
                        atr : {} // 결과 속성
                    };

                    // console.log(block_match);

                    // 탐색기
                    (function loop(count){
                        if(block_match_len <= count){return false;}
                        var i_block = block_match[count],
                        match = i_block.match(/^div|p|css|atr|ccss|catr/i),
                        r_match = match ? match[0] : '';

                        // console.log(i_block);
                        // console.log(match);
                        if(r_match.match(RegExp(g_check_block_type))){
                            /* 블럭 태그(HTML DOM) 생성 */
                            r_dom = new p_cdom(r_match);

                            var cid_match = i_block.replace(/^.*?(?=[\#\.])/i, '');

                            dom_id = cid_match.replace(/^\..*?(?=\#)|\..*/g, '').split('#')[1],
                            dom_class = cid_match.replace(/^\#.*?(?=\.)|\#.*/g, '').split('.')[1];

                            // console.log(cid_match);
                            // console.log('DOM ID : ' + dom_id );
                            // console.log('CLASS ID : ' + dom_class);
                        }else if(r_match.match(/css|atr|ccss|catr/i)){
                            /* css 및 속성 입력 */
                            var i_group = i_block.match(/\{.*?\}/i);

                            i_group = i_group ? i_group[0].replace(/[\{\}]/gi, '').replace(/;$/, '') : ''; // 마지막 ; 를 삭제
                            // i_group = i_group;

                            if(i_group){ // 그룹 문장이 존재하면
                                var r_group = i_group.split(/[:;]/), // : 와 ; 기준으로 나눈다
                                r_group_len = r_group.length,
                                set_obj = null;

                                // console.log(r_group);

                                if(r_match.match(/css|atr/i)){
                                    set_obj = r_set_obj[r_match];
                                }else{
                                    // set_obj = n_toss_set[r_match];
                                }

                                (function deepset(count, tick){
                                    if(r_group_len > count){
                                        if(tick){
                                            set_obj[tick] = r_group[count];
                                            deepset(count+1);
                                        }else{
                                            deepset(count+1, r_group[count]);
                                        }
                                        if(tick === 0){ // key
                                        }else if(tick === 1){ // value
                                            deepset(count+1, 0);
                                        }
                                    }
                                })(0);

                            }

                        }else if(r_match.match(/cs/i)){

                        }

                        loop(count+1); // 다시 루프 탐색..
                    })(0);

                    if(r_dom){ // dom 이 만들어졌다면
                        // console.log(history_dom_depth.lastDom());
                        history_dom_depth.lastDom().$append(r_dom);

                        history_dom_depth.push({
                            dom : r_dom, toss : {}
                        });

                        if(dom_id){ // 아이디가 존재 하면
                            r_dom.id = dom_id;
                        }

                        if(dom_class){ // 클래스가 존재 하면
                            r_dom.classList.add(dom_class);
                        }

                        r_dom.$attr(r_set_obj.atr);
                        r_dom.$css(r_set_obj.css);
                    }

                }else{ // 입력 (문자열 입력만 존재)
                    // console.log('others');
                    // console.log(data);
                    history_dom_depth.lastDom().$append(new p_cdom('text', data));
                }

                ct_list_loop(i_count+1);
            })(0);


            return { dom : dom_box, list : result };
        }
    };


    lo().addPlugin('ctemplate', masterObj);

    // lo().addPlugin('ctemplate', function(){
    //     console.log('can not Call pulgin - ctemplate');
    // });

});
