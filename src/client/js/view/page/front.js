/* 뷰 선언 포멧
*/
lo(function(side_lo, appMgrList, plugin){

    appMgrList('tt').addView('page', 'front', [], [], function(prams){

        /* 필수 */
        var self = this,
        view = new plugin.cdom('div'),
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

            view.$abs().$css({
                width : '100%', height : '100%',
                backgroundColor : 'rgba(0,0,0,0.5)'
            });

            // var test = new plugin.ctemplate(`
            //     <^div#id css{} child{}(
            //         <^div#id css{} child{}(
            //             test!<br>test!
            //         )^>
            //     )^>
            // `);
            var oldT = Date.now();
            var test = new plugin.ctemplate(`
                <test>
                <^div#id1 css{
                    width:100px;height:100px;
                } atr{} cs{}>
                    <^div#id2 css{}>test1<^>
                <^>

                <^div#id2 css{}>test2<^>
                br
            `, view);
            // for(var i=0; i<100; i++){
            //     console.log('?');
            // }
            console.log(Date.now() - oldT);

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
