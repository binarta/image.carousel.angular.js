angular.module('image.carousel', [])
    .factory('updateImageCarousel', ['config', 'scopedRestServiceHandler', 'topicMessageDispatcher', UpdateImageCarouselFactory])
    .factory('fetchImageCarousel', ['config', 'scopedRestServiceHandler', FetchImageCarouselFactory])
    .directive('imageCarousel', ImageCarouselDirectiveFactory);

function UpdateImageCarouselFactory(config, scopedRestServiceHandler, topicMessageDispatcher) {
    return function ($scope, carousel, success) {
        scopedRestServiceHandler({
            scope: $scope,
            params: {
                method: 'PUT',
                url: (config.baseUri || '') + 'api/entity/image-carousel',
                data: {
                    namespace: config.namespace,
                    name: carousel.name,
                    length: carousel.length - 0
                },
                withCredentials: true
            },
            success: function () {
                success();
                topicMessageDispatcher.fire('system.success', {
                    code: 'image.carousel.update.success',
                    default: 'Image Carousel Updated!'
                });
            }
        });
    }
}

function FetchImageCarouselFactory(config, scopedRestServiceHandler) {
    return function ($scope, name, presenter) {
        scopedRestServiceHandler({
            scope: $scope,
            params: {
                method: 'GET',
                headers:{
                    'x-namespace':config.namespace
                },
                url: (config.baseUri || '') + 'api/entity/image-carousel?name=' + name
            },
            success: presenter,
            notFound: function() {
                presenter({length:0});
            }
        });
    }
}

function ImageCarouselDirectiveFactory() {
    return {
        restrict: ['E', 'A', 'C'],
        scope: true,
        controller: ['$scope', 'fetchImageCarousel', 'updateImageCarousel', ImageCarouselController],
        link: function (scope, els, attrs, ctrl) {
            scope.$watch('name', function () {
                ctrl.init(scope.name);
            });
        }
    };
}

function ImageCarouselController($scope, fetchImageCarousel, updateImageCarousel) {
    var self = this;

    this.init = function (name) {
        $scope.new = {};
        $scope.carousel = {name: name};
        $scope.editable = false;
        fetchImageCarousel($scope, name, function (it) {
            $scope.carousel.length = it.length;
            $scope.new.length = it.length;
            self.generateItems();
        });
    };

    this.generateItems = function () {
        var items = [];
        for (var i = 0; i < $scope.carousel.length; i++)
            items.push({
                index: i,
                path: self.toPath(i)
            });
        $scope.carousel.items = items;
    };

    this.toPath = function (idx) {
        var prefix = 'carousels';
        if ($scope.carousel.name.lastIndexOf('/', 0) != 0) prefix += '/';
        return prefix + $scope.carousel.name + '/' + idx + '.img';
    };

    $scope.edit = function () {
        $scope.editable = !$scope.editable;
    };

    $scope.submit = function () {
        $scope.carousel.length = $scope.new.length;
        $scope.carousel.length -= 0;
        updateImageCarousel($scope, $scope.carousel, function () {
            self.generateItems();
        });
    }
}