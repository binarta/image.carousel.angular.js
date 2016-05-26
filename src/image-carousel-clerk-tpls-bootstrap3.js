angular.module("image.carousel").run(["$templateCache", function($templateCache) {$templateCache.put("bin-image-carousel-edit.html","<div class=\"bin-menu-edit-body bin-image-carousel\"><div class=\"alert alert-danger hidden-xs\" ng-repeat=\"v in violations\" i18n=\"\" code=\"upload.image.{{::v}}\" default=\"{{::v}}\" read-only=\"\"><i class=\"fa fa-exclamation-triangle fa-fw\"></i> {{::var}}</div><div class=\"row\" ng-hide=\"openedImage\"><div class=\"col-xs-6 col-sm-4 col-md-3\" ng-repeat=\"image in images track by image.id\"><div class=\"image\"><img bin-image=\"{{::image.path}}\" width=\"160\" read-only=\"\" ng-click=\"openImage(image)\"></div></div><div class=\"col-xs-6 col-sm-4 col-md-3\"><div class=\"image image-add\"><button type=\"button\" ng-disabled=\"working\" ng-click=\"addImage()\"><span ng-show=\"working\"><i class=\"fa fa-spinner fa-spin fa-3x\"></i></span> <span ng-hide=\"working\"><i class=\"fa fa-camera fa-3x\"></i></span></button></div></div></div><div class=\"row\" ng-if=\"openedImage\"><div class=\"col-xs-12\"><div class=\"image-opened\"><img bin-image=\"{{::openedImage.path}}\" read-only=\"\"></div></div></div><div class=\"alert alert-danger visible-xs\" ng-repeat=\"v in violations\" i18n=\"\" code=\"upload.image.{{::v}}\" default=\"{{::v}}\" read-only=\"\"><i class=\"fa fa-exclamation-triangle fa-fw\"></i> {{::var}}</div></div><div class=\"bin-menu-edit-actions\"><div ng-show=\"openedImage\"><button type=\"button\" class=\"btn btn-default pull-left\" ng-disabled=\"working\" ng-click=\"closeImage()\" i18n=\"\" code=\"clerk.menu.back.button\" read-only=\"\"><i class=\"fa fa-angle-left\"></i> <span ng-bind=\"::var\"></span></button> <button type=\"button\" class=\"btn btn-danger pull-right\" ng-disabled=\"working\" ng-click=\"deleteImage(openedImage)\" i18n=\"\" code=\"upload.image.delete.image.button\" read-only=\"\"><span ng-show=\"working\"><i class=\"fa fa-spinner fa-spin fa-fw\"></i></span> <span ng-hide=\"working\"><i class=\"fa fa-trash fa-fw\"></i></span> <span ng-bind=\"::var\"></span></button></div><div ng-hide=\"openedImage\"><button type=\"button\" class=\"btn btn-default pull-right\" ng-disabled=\"working\" ng-click=\"close()\" i18n=\"\" code=\"clerk.menu.close.button\" read-only=\"\" ng-bind=\"::var\"></button></div></div>");}]);