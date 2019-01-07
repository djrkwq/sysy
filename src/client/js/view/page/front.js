/* 뷰 선언 포멧
*/
lo(function(side_lo, appMgrList, plugin){

    appMgrList('tt').addView('page', 'front', [], [], function(prams){

        /* 필수 */
        var self = this,
        //master div를 생성해준다 (그 안에 이하 뷰 내용 추가됨)
        view = new plugin.cdom('div'), //document.createElement('div')
        view_type = prams.type,
        view_id = prams.id,
        init_data = prams.data,
        app_mgr = prams.app; // app 매니저 전신

        /* UI Views */

        /* 외부 */

        /* 정보 */

        /* 이밴트 */

        /* 필수) 뷰 반환 */
        self.getView = function(){return view;};

        /* 필수) 메인 페이지 초기화 함수*/
        self.init = function(){

            view.$abs().$css({      //abs:absolute position
                width : '100%', height : '100%',
                backgroundColor : 'rgba(0,0,0,0.5)'
            });


            var div1 = new plugin.cdom('div');

            div1.$append(new plugin.cdom('text', 'test1'));
            // div1.appendChild(document.createTextNode('test2'));

            var selectbox = new plugin.cdom('input');
            //selectbox.type = 
            selectbox.$attr({
                'type': 'checkbox'
                ,'name': 'aaa'
                ,'id' : 'aaa'
                ,'value' :'test'
                ,'text' : 'text'
                ,'class' : 'a'
            }); 
            selectbox.$attr();
            div1.$append(selectbox);
            
            // div1.$appendTo(view);
            view.$append(div1);

            div1.$abs().$x = 'pw/2-w/2';
            div1.$y = 'ph/2-h/2';

            // var oldT = Date.now();  //^ : tag, #:id 
            // var test = new plugin.ctemplate(`
            //     <test>
            //     <^div#id1 css{          
            //         width:100px;height:100px;
            //     } atr{}>
            //         <^div#id2 css{}>test1<^>
            //     <^>

            //     <^div#id2 css{}>test2<^>
            //     br
            // `, view); //view에 test를 append
            // console.log(Date.now() - oldT);

        };

        /* 선택) 새로고침 */
        self.refresh = function(data){};

        /* 선택) 히스토리에서 삭제시 동작 */
        self.onDestroy = function(){
        };

        /* 선택) 메세지 */
        self.message = function(data){};

    });

});
