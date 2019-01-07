/* 뷰 선언 포멧
*/
lo(function(side_lo, appMgrList, plugin){

    appMgrList('tt').addView('popup', 'intro', [], [], function(prams){

        /* 필수 */
        var self = this,
        view = new plugin.cdom('div'),
        view_type = prams.type,
        view_id = prams.id,
        init_data = prams.data,
        app_mgr = prams.app; // app 매니저 전신

        /* UI Views */
        var ui_main_title = null,
        ui_main_title_side1 = null,
        ui_main_title_side2 = null;

        /* 외부 */
        var ipc_renderer = init_data.ipc_renderer;

        /* 정보 */
        var info_title_text_width = 0;

        /* 이밴트 */
        var event_w_resize = null;

        /* 필수) 뷰 반환 */
        self.getView = function(){return view;};

        /* 필수) 메인 페이지 초기화 함수*/
        self.init = function(){

            view.$abs().$css({
                backgroundColor : 'rgba(255,0,0,0.5)',
                width : '100%', height : '100%'
            });

            /* child ui 초기화 */
            ui_main_title = new plugin.cdom('div');
            ui_main_title_side1 = new plugin.cdom('div');
            ui_main_title_side2 = new plugin.cdom('div');

            /* child를 view에 추가 */
            view.$append( ui_main_title_side1, ui_main_title_side2, ui_main_title ).$css({
                cursor : 'pointer'
            });

            /* UI 세팅 */
            ui_main_title.$abs().$css({
                fontSize : '100px', textAlign : 'center', whiteSpace: 'nowrap',
                color : 'rgba(255,210,0,1)'
            }).$setPinType('center-middle').innerHTML = 'TROLL TOOLs';

            ui_main_title.$setX('pw/2').$setY('ph/2');

            info_title_text_width = ui_main_title.$width+30;

            console.log(info_title_text_width);

            ui_main_title_side1.$abs().$css({
                fontSize : '100px', textAlign : 'center', whiteSpace: 'nowrap',
                color : 'rgba(255,0,255,0.5)'
            }).$setPinType('center-middle').innerHTML = 'TROLL TOOLs';

            ui_main_title_side1.$setX('pw/2-5').$setY('ph/2-5');

            ui_main_title_side2.$abs().$css({
                fontSize : '100px', textAlign : 'center', whiteSpace: 'nowrap',
                color : 'rgba(0,255,255,0.5)'
            }).$setPinType('center-middle').innerHTML = 'TROLL TOOLs';

            ui_main_title_side2.$setX('pw/2+5').$setY('ph/2+5');
            /* UI 세팅 끝 */


            /* 윈도우 리사이즈 */
            // window.addEventListener('resize', event_w_resize = function(){
            //     view.$setWidth('pw').$setHeight('ph');
            // });

            /* 애니메이션 */
            /* FPS */
            side_lo.aniFramePool.setFPS(100);
            side_lo.aniFramePool.addFrame('test', function(startTime, timeData, data, removeFrame){
                /* 간격에 따른 글자 줄바뀜 적 */
                var text = info_title_text_width >= view.$width ? 'TROLL<br>TOOLs' : 'TROLL TOOLs';
                /* 위치 재조정 */
                ui_main_title.$innerHTML(text).$setX('pw/2').$setY('ph/2');
                /* 랜덤 위치 조정 */
                ui_main_title_side1.$innerHTML(text).$setX('pw/2-'+side_lo.getRandom(3,9)).$setY('ph/2-'+side_lo.getRandom(3,9));
                ui_main_title_side2.$innerHTML(text).$setX('pw/2+'+side_lo.getRandom(3,9)).$setY('ph/2+'+side_lo.getRandom(3,9));
                // console.log(timeData);
                // timeData.isFree = true;
            });
            side_lo.aniFramePool.on();

            /* after animation */
            var toid = setTimeout(function(){

                // view.$css('opacity', 0.3);
                app_mgr.removeViewHistory('popup', view_id).addViewHistory('page', 'front1', 'front').apply(null, true, true);
                clearTimeout(toid);
            }, 200);

            /* 마우스 이밴트 관련 */
            ui_main_title.$$mouseEventData = {
                type : view_type, id : view_id,
                models : {
                    click : ['test']
                }
            };

        };


        /* 선택) 새로고침 */
        self.refresh = function(data){};

        /* 선택) 히스토리에서 삭제시 동작 */
        self.onDestroy = function(){
            side_lo.aniFramePool.removeFrame('test');
            // window.removeEventListener('resize', event_w_resize);
        };

        /* 선택) 메세지 */
        self.message = function(data){};


    });

});
