(function () {
    angular.module('image.carousel', ['config', 'image-management', 'rest.client', 'toggle.edit.mode', 'notifications'])
        .service('binImageCarousel', ['$q', '$filter', 'config', 'imageManagement', 'restServiceHandler', BinImageCarouselService])
        .controller('binImageCarouselController', ['$scope', '$element', 'binImageCarousel', 'editModeRenderer', 'ngRegisterTopicHandler', BinImageCarouselController])
        .controller('binImageCarouselHeroController', ['binImageCarousel', BinImageCarouselHeroController])
        .directive('binImageCarousel', BinImageCarouselDirective)
        .component('binImageCarousel', new BinImageCarouselComponent());

    function BinImageCarouselService($q, $filter, config, imageManagement, rest) {
        this.getImages = function (args) {
            var items = [];
            if (args && args.prefetchedItems) items = args.prefetchedItems;
            return sanitizeItems(items);
        };

        this.getHeroImage = function (args) {
            var images = this.getImages(args);
            return images.length > 0 ? images[0] : undefined;
        };

        this.addImage = function (args) {
            var deferred = $q.defer();

            imageManagement.fileUpload({
                dataType: 'json',
                add: function (e, d) {
                    var violations = imageManagement.validate(d);
                    if (violations.length > 0) deferred.reject(violations);
                    else {
                        imageManagement.upload({
                            file: d,
                            code: args.carouselId,
                            imageType: 'foreground',
                            carouselImage: true
                        }).then(function (result) {
                            result.id = convertPathToId(result.path);
                            deferred.resolve(result);
                        }, function (reason) {
                            violations.push(reason);
                            deferred.reject(violations);
                        }, function (update) {
                            deferred.notify(update);
                        });
                    }
                }
            });
            imageManagement.triggerFileUpload();

            return deferred.promise;
        };

        this.deleteImage = function (id) {
            return rest({
                params: {
                    method: 'DELETE',
                    url: config.baseUri + 'api/entity/catalog-item?id=' + encodeURIComponent(id),
                    withCredentials: true
                }
            });
        };

        function sanitizeItems(items) {
            var images = $filter('orderBy')(items, 'priority');
            angular.forEach(images, function (image) {
                image.path = convertIdToPath(image.id);
            });
            return images;
        }

        function convertIdToPath(id) {
            return id.replace(/^\/+/, '');
        }

        function convertPathToId(path) {
            return '/' + path;
        }
    }

    function BinImageCarouselDirective() {
        return {
            restrict: 'A',
            scope: {
                id: '=binImageCarousel',
                items: '='
            },
            controller: 'binImageCarouselController',
            controllerAs: '$ctrl',
            bindToController: true,
            templateUrl: 'bin-image-carousel-legacy.html'
        }
    }

    function BinImageCarouselComponent() {
        this.templateUrl = 'bin-image-carousel.html';

        this.bindings = {
            id: '=itemId',
            items: '=',
            templateUrl: '@'
        };

        this.controller = 'binImageCarouselController';
    }

    function BinImageCarouselController($scope, $element, binImageCarousel, editModeRenderer, topics) {
        var $ctrl = this;
        var limit = 20;

        topics($scope, 'edit.mode', function (editModeActive) {
            $ctrl.editing = editModeActive;
        });

        var element = angular.element($element[0].querySelector('.carousel'));
        if (element.carousel) {
            element.carousel({interval:false});

            $ctrl.previous = function () {
                element.carousel('prev');
            };

            $ctrl.next = function () {
                element.carousel('next');
            };
        }

        $ctrl.images = binImageCarousel.getImages({prefetchedItems: $ctrl.items});

        $ctrl.edit = function () {
            var scope = $scope.$new();
            scope.images = $ctrl.images;

            scope.addImage = function () {
                resetViolation();

                if ($ctrl.images.length >= limit) {
                    scope.violations.push('images.upperbound');
                } else {
                    binImageCarousel.addImage({carouselId: $ctrl.id}).then(function (result) {
                        $ctrl.images.push(result);
                    }, function (violations) {
                        scope.violations = violations;
                    }, function () {
                        scope.working = true;
                    }).finally(function () {
                        scope.working = false;
                    });
                }
            };

            scope.deleteImage = function (image) {
                resetViolation();

                scope.working = true;
                binImageCarousel.deleteImage(image.id).then(function () {
                    if ($ctrl.images.indexOf(image) !== -1) $ctrl.images.splice($ctrl.images.indexOf(image), 1);
                    scope.openedImage = undefined;
                }).finally(function () {
                    scope.working = false;
                });
            };

            scope.openImage = function (image) {
                resetViolation();
                scope.openedImage = image;
            };

            scope.closeImage = function () {
                resetViolation();
                scope.openedImage = undefined;
            };

            scope.close = editModeRenderer.close;

            if ($ctrl.images.length === 0) scope.addImage();

            editModeRenderer.open({
                templateUrl: 'bin-image-carousel-edit.html',
                scope: scope
            });

            function resetViolation() {
                scope.violations = [];
            }
        };
    }

    function BinImageCarouselHeroController(binImageCarousel) {
        var self = this;

        this.init = function (args) {
            self.image = binImageCarousel.getHeroImage({prefetchedItems: args.items});
        };
    }
})();
