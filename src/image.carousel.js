(function () {
    angular.module('image.carousel', ['config', 'image-management', 'rest.client', 'toggle.edit.mode', 'notifications'])
        .service('binImageCarousel', ['$q', '$filter', 'config', 'imageManagement', 'restServiceHandler', BinImageCarouselService])
        .controller('binImageCarouselController', ['$scope', '$element', 'binImageCarousel', 'editMode', 'editModeRenderer', '$templateCache', BinImageCarouselController])
        .controller('binImageCarouselHeroController', ['binImageCarousel', BinImageCarouselHeroController])
        .directive('binImageCarousel', ['$templateCache', 'ngRegisterTopicHandler', BinImageCarouselDirective]);

    function BinImageCarouselService($q, $filter, config, imageManagement, rest) {
        this.getImages = function (args) {
            var deferred = $q.defer();
            var items = [];
            if (args && args.prefetchedItems) items = args.prefetchedItems;
            deferred.resolve(sanitizeItems(items));
            return deferred.promise;
        };

        this.addImage = function (args) {
            var deferred = $q.defer();

            imageManagement.fileUpload({
                dataType: 'json',
                add: function(e, d) {
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

    function BinImageCarouselDirective($templateCache, topics) {
        return {
            restrict: 'A',
            scope: {
                id: '=binImageCarousel',
                items: '='
            },
            controller: 'binImageCarouselController',
            controllerAs: 'ctrl',
            bindToController: true,
            template: $templateCache.get('bin-image-carousel.html'),
            link: function (scope) {
                topics(scope, 'edit.mode', function (editModeActive) {
                    scope.editing = editModeActive;
                });
            }
        }
    }

    function BinImageCarouselController($scope, $element, binImageCarousel, editMode, editModeRenderer, $templateCache) {
        var self = this;
        var limit = 10;

        binImageCarousel.getImages({
            carouselId: self.id,
            prefetchedItems: self.items
        }).then(function (images) {
            self.images = images;

            editMode.bindEvent({
                scope: $scope,
                element: $element,
                permission: 'edit.mode',
                onClick: onEdit
            });
        });

        function onEdit() {
            var scope = $scope.$new();
            scope.images = self.images;

            scope.addImage = function () {
                resetViolation();

                if (self.images.length >= 10) {
                    scope.violations.push('images.upperbound');
                } else {
                    binImageCarousel.addImage({carouselId: self.id}).then(function (result) {
                        self.images.push(result);
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
                    if (self.images.indexOf(image) != -1) self.images.splice(self.images.indexOf(image), 1);
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

            if (self.images.length == 0) scope.addImage();

            editModeRenderer.open({
                template: $templateCache.get('bin-image-carousel-edit.html'),
                scope: scope
            });

            function resetViolation() {
                scope.violations = [];
            }
        }
    }

    function BinImageCarouselHeroController(binImageCarousel) {
        var self = this;

        this.init = function (args) {
            binImageCarousel.getImages({
                carouselId: args.id,
                prefetchedItems: args.items
            }).then(function (images) {
                if (images.length > 0) self.image = images[0];
            });
        };
    }
})();