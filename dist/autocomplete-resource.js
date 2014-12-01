'use strict';

angular.module('autocomplete-resource',[])
    .directive('autocompleteResource', function ($timeout, $injector) {
        return {
            restrict: 'AEC',
            scope: {
                label: '@',
                itemlabel: '@',
                itemdescrip: '@',
                itemdescrip2: '@',
                idautocomplete: '@',
                classautocomplete: '@',
                placeholder: '@',
                isrequired: '@',
                requiredmsj: '@',
                model: '=',
                modelsourcename: '@',
                clearInputOnSelection: '@',
                itemicon: '@',
                serviceatributefiltername: '@',
                onSelect: '&',
                prefilters: '=',
                ngdisabled: '='
            },
            link: function (scope, elem, attrs) {

                scope.clearInputOnSelectionParsed = (scope.clearInputOnSelection=="true");

                scope.handleBlur = function () {
                    scope.listOpened = false;
                    if (scope.model == undefined)
                        scope.modelfilter = undefined;

                };

                scope.listOpened = false;
                scope.handleSelection = function (selectedItem) {
                    if (scope.clearInputOnSelectionParsed) {
                        scope.modelfilter = '';
                    } else {
                        scope.modelfilter = scope.getItemLabel(selectedItem,scope.itemlabel);
                    }
                    scope.model = selectedItem;
                    scope.current = 0;
                    scope.selected = true;
                    scope.listOpened = false;
                    $timeout(function () {
                        scope.onSelect();
                    }, 200);
                };

                scope.current = 0;
                scope.selected = true; // hides the list initially
                scope.isCurrent = function (index) {
                    return scope.current == index;
                };
                scope.setCurrent = function (index) {
                    scope.current = index;
                };
                //buca items desde el servicio rest enviando el filtro en modelfilter
                scope.refreshItems = function (filter) {

                    scope.items = undefined;
                    var service = elem.injector().get(scope.modelsourcename);
                    var params = {};
                    if (scope.prefilters) {
                        params = scope.prefilters;
                    }


                    params[scope.serviceatributefiltername] = filter;

                    service.query(params, function (itemsReturned) {

                        if (itemsReturned instanceof Array) { //si no esta paginado
                            scope.items = itemsReturned;
                        } else {
                            scope.items = (itemsReturned.results.length > 0) ? itemsReturned.results : undefined;
                        }

                        scope.selected = false;
                        scope.current = 0;

                        //muestro la lista de items
                        scope.listOpened = true;
                    });
                };

                scope.updateItemList = function() {
                    var lastModelFilter =scope.modelfilter;

                    $timeout(function () {

                        if(lastModelFilter==scope.modelfilter)
                        {
                            scope.refreshItems(scope.modelfilter);


                        }



                    }, 500);


                };
                scope.haveLabel=function(){
                    return scope.label!=undefined;
                }
                scope.tieneAlert=function(){
                    return scope.requiredmsj!=undefined && scope.requiredmsj!='';
                }
                scope.removeItem = function () {
                    scope.model = undefined;
                    scope.modelfilter = undefined;
                }
                scope.keyDown = function ($event) {

                    //si la tecla apretada es una flecha, aumento el index de la seleccion sino busco remoto
                    if (($event.keyCode < 37 || $event.keyCode > 40) && $event.keyCode != 13) {

                        switch ($event.keyCode) {
                            case 27:
                                //es escape, cerramos la lista y borramos el input
                                scope.listOpened = undefined;
                                scope.removeItem();

                                break;
                            case 8:
                                //es escape, cerramos la lista y borramos el input
                                scope.listOpened = undefined;
                                scope.model = undefined;

                                break;
                            case 9:         //TAB
                                //No hacemos nada con el tab, simplemente pasamos al siguiente input
                                break;
                            /*default:
                                var charCode = $event.keyCode || $event.which;
                                scope.refreshItems(
                                        ((scope.modelfilter != undefined) ? scope.modelfilter : "") + String.fromCharCode(charCode)
                                );

                                break;*/
                        }

                    } else {
                        //es alguna flecha
                        switch ($event.keyCode) {
                            case 40: //flecha hacia abajo
                                if (!scope.listOpened) {
                                    //si aprete flecha para abjo y no habia nada en el input
                                    scope.refreshItems(scope.modelfilter);
                                } else {

                                    scope.current = scope.current + 1;
                                }

                                break;
                            case 38:
                                scope.current = scope.current - 1;
                                break;
                            case 13: //enter
                                scope.handleSelection(scope.items[scope.current]);
                                break;
                        }

                        if (scope.items != undefined && scope.current > scope.items.length - 1) scope.current = scope.items.length - 1;
                        if (scope.items != undefined && scope.current < 0) scope.current = 0;
                    }


                };
                //retorna el label del item,puede ser recursivo es decir: item.propiedad.propiedad2
                scope.getItemLabel = function (item,path) {
                    if (path!=undefined) {
                        var atributes = path.split(".");

                        var label = item;
                        _.each(atributes, function (element, index, list) {
                            label = label[element];
                        });

                        return label;
                    }
                };

                if (scope.model != undefined && !scope.clearInputOnSelectionParsed)
                    scope.modelfilter = scope.getItemLabel(scope.model,scope.itemlabel);

                //cuando hago el unbind desde afuera de la directiva, tengo que borrar el filtro
                scope.$watch('model', function (model_value) {
                    if (model_value == undefined) {
                        //scope.modelfilter=undefined;
                        scope.removeItem();

                    } else {
                        scope.modelfilter=scope.getItemLabel(scope.model,scope.itemlabel);
                    }
                }, true);


            },
            template: "<div class=\"form-group\">
    <label ng-show=\"label\">{{label}}</label>
    <div class=\"input-group\">
        <span class=\"input-group-addon\"><span class=\"glyphicon glyphicon-search\"></span></span>

        <input ng-disabled=\"ngdisabled\" ng-required=\"{{isrequired}}\" autocomplete=\"off\" class=\"{{classautocomplete}} form-control\" id=\"{{idautocomplete}}\" type=\"text\" ng-model=\"modelfilter\" placeholder=\"{{placeholder}}\" ng-keypress=\"keyDown($event)\" ng-change=\"updateItemList()\" ng-blur=\"handleBlur()\" />
        <span ng-show=\"model && !clearInputOnSelectionParsed\" class=\"input-group-btn\">
            <button ng-click=\"removeItem()\" class=\"btn btn-default\" type=\"button\"><span class=\"glyphicon glyphicon-remove\"></span></button>
        </span>

    </div>
    <div style=\"position:relative;\" ng-class=\"{'top-label':haveLabel(),'top-sin-label':!haveLabel(),'tieneAlert': tieneAlert() }\"  >
        <alert style=\"position:absolute;top:0px;left:0px;\" type=\"danger\" ng-show=\"((model.$invalid) || (model==undefined) ) && requiredmsj\" ><span class=\"glyphicon glyphicon-warning-sign\"></span> {{requiredmsj}}</alert>
        <ul class=\"autocomplete dropdown-menu\" ng-hide=\"!listOpened || selected\" style=\"display:block;position:absolute;top:0px;left:0px;\" role=\"menu\"  >
            <li ng-hide=\"items\" class=\"autocomplete-warning-label\"><span class=\"glyphicon glyphicon-info-sign\"></span> No se encontraron resultados </li>
            <li class=\"item\" ng-class=\"{active:isCurrent($index)}\" ng-repeat=\"item in items track by $index\" ng-mousedown=\"handleSelection(item)\" style=\"cursor:pointer\"  ng-mouseenter=\"setCurrent($index)\">
                <p class=\"itemicon\" ng-class=\"itemicon\"></p>
                <p class=\"itemlabel\">{{getItemLabel(item,itemlabel)}}</p>
                <p ng-show=\"itemdescrip\" class=\"itemdescrip\">{{getItemLabel(item,itemdescrip)}}</p>
                <p ng-show=\"itemdescrip2\" class=\"itemdescrip2\">{{getItemLabel(item,itemdescrip2)}}</p>
                <div class=\"reset-float\"/>
            </li>

        </ul>
    </div>
</div>"
        };
    });