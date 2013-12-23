describe('image carousel', function () {
    beforeEach(module('image.carousel'));
    beforeEach(module('notifications'));
    beforeEach(module('rest.client'));
    beforeEach(module('config'));

    beforeEach(inject(function(config) {
        config.namespace = 'namespace';
    }));

    describe('update-image-carousel service', function () {
        var rest, success;
        var scope = 'scope';
        var carousel = {
            name: 'name',
            length: 2
        };

        beforeEach(inject(function (updateImageCarousel, scopedRestServiceHandlerMock) {
            rest = scopedRestServiceHandlerMock;
            success = false;
            updateImageCarousel(scope, carousel, function() {
                success = true;
            });
        }));

        it('performs PUT request', inject(function (config) {
            expect(rest.context.scope).toEqual(scope);
            expect(rest.context.params.method).toEqual('PUT');
            expect(rest.context.params.url).toEqual('api/entity/image-carousel');
            expect(rest.context.params.data).toEqual({
                namespace: config.namespace,
                name: carousel.name,
                length: carousel.length
            });
            expect(rest.context.params.withCredentials).toEqual(true);
        }));

        it('performs PUT request with baseUri', inject(function (config, updateImageCarousel, scopedRestServiceHandlerMock) {
            config.baseUri = 'http://host/context/';
            rest = scopedRestServiceHandlerMock;
            success = false;
            updateImageCarousel(scope, carousel, function() {
                success = true;
            });
            expect(rest.context.params.url).toEqual(config.baseUri + 'api/entity/image-carousel');
        }));

        describe('success', function () {
            var dispatcher;

            beforeEach(inject(function (topicMessageDispatcherMock, scopedRestServiceHandlerMock) {
                dispatcher = topicMessageDispatcherMock;
                scopedRestServiceHandlerMock.context.success();
            }));

            it('invokes callback', function() {
                expect(success).toEqual(true);
            });

            it('raise success notification', function () {
                expect(dispatcher['system.success']).toEqual({
                    code: 'image.carousel.update.success',
                    default: 'Image Carousel Updated!'
                });
            });
        });
    });

    describe('fetch-image-carousel service', function () {
        var rest, carousel;
        var scope = 'scope';
        var name = "name";

        beforeEach(inject(function (fetchImageCarousel, scopedRestServiceHandlerMock) {
            rest = scopedRestServiceHandlerMock;
            fetchImageCarousel(scope, name, function (it) {
                carousel = it;
            });
        }));

        it('performs GET request', inject(function (config) {
            expect(rest.context.scope).toEqual(scope);
            expect(rest.context.params.method).toEqual('GET');
            expect(rest.context.params.headers['x-namespace']).toEqual(config.namespace);
            expect(rest.context.params.url).toEqual('api/entity/image-carousel?name=' + name);
        }));

        it('performs GET request with baseUri', inject(function (config, fetchImageCarousel, scopedRestServiceHandlerMock) {
            config.baseUri = 'http://host/context/';
            rest = scopedRestServiceHandlerMock;
            fetchImageCarousel(scope, name, function (it) {
                carousel = it;
            });
            expect(rest.context.params.url).toEqual(config.baseUri + 'api/entity/image-carousel?name=' + name);
        }));

        describe('success', function () {
            var payload = 'payload';

            beforeEach(inject(function (scopedRestServiceHandlerMock) {
                scopedRestServiceHandlerMock.context.success(payload);
            }));

            it('present carousel', function () {
                expect(carousel).toEqual(payload);
            });
        });

        describe('not found', function() {
            beforeEach(inject(function (scopedRestServiceHandlerMock) {
                scopedRestServiceHandlerMock.context.notFound();
            }));

            it('expose carousel with 0 length', function() {
                expect(carousel).toEqual({length:0});
            });
        });
    });

    describe('image-carousel directive', function () {
        var directive;

        beforeEach(inject(function () {
            directive = ImageCarouselDirectiveFactory();
        }));

        it('restricted on', function () {
            expect(directive.restrict).toEqual(['E', 'A', 'C']);
        });

        it('scope', function () {
            expect(directive.scope).toEqual(true);
        });

        it('controller', function () {
            expect(directive.controller).toEqual(['$scope', 'fetchImageCarousel', 'updateImageCarousel', ImageCarouselController]);
        });

        describe('on link', function () {
            var scope, els, attrs, ctrl, watches;

            beforeEach(function () {
                watches = {};
                scope = {
                    name: '/carousel/name',
                    $watch: function (expression, callback) {
                        watches[expression] = callback;
                    }
                };
                ctrl = {init: function (name) {
                    this.name = name;
                }};
                directive.link(scope, els, attrs, ctrl);
            });

            it('controller not initialized', function () {
                expect(ctrl.name).toEqual(undefined);
            });

            describe('on triggered watch', function () {
                beforeEach(function () {
                    watches['name']();
                });

                it('init controller', function () {
                    expect(ctrl.name).toEqual(scope.name);
                });
            });
        });
    });

    describe('ImageCarouselController', function () {
        var scope, ctrl, updater, fetcher, name;

        beforeEach(inject(function ($controller) {
            name = 'carousel-name';
            scope = {};
            updater = {};
            fetcher = {};
            ctrl = $controller(ImageCarouselController, {
                $scope: scope,
                updateImageCarousel: function (scope, carousel, success) {
                    updater.scope = scope;
                    updater.carousel = carousel;
                    updater.success = success;
                },
                fetchImageCarousel: function (scope, name, presenter) {
                    fetcher.scope = scope;
                    fetcher.name = name;
                    fetcher.presenter = presenter;
                }
            });
        }));

        describe('on init', function () {
            beforeEach(function () {
                ctrl.init(name);
            });

            it('expose name on scope', function () {
                expect(scope.carousel.name).toEqual(name);
            });

            it('editable mode disabled', function () {
                expect(scope.editable).toEqual(false);
            });

            describe('fetch details', function () {
                it('passes scope', function () {
                    expect(fetcher.scope).toEqual(scope);
                });

                it('passes name', function () {
                    expect(fetcher.name).toEqual(name);
                });

                describe('success', function () {
                    var payload = {length: 5};

                    beforeEach(function () {
                        fetcher.presenter(payload);
                    });

                    it('expose length on scope', function () {
                        expect(scope.carousel.length).toEqual(payload.length);
                    });

                    it('expose length on scope.new', function () {
                        expect(scope.new.length).toEqual(payload.length);
                    });

                    it('expose carousel items on scope', function() {
                        expect(scope.carousel.items).toEqual([
                            {index:0, path:'carousels/carousel-name/0.img'},
                            {index:1, path:'carousels/carousel-name/1.img'},
                            {index:2, path:'carousels/carousel-name/2.img'},
                            {index:3, path:'carousels/carousel-name/3.img'},
                            {index:4, path:'carousels/carousel-name/4.img'}
                        ]);
                    });
                });
            });
        });

        describe('on init when name has a leading slash', function() {
            beforeEach(function () {
                name = '/' + name;
                ctrl.init(name);
            });

            describe('success', function () {
                var payload = {length: 1};

                beforeEach(function () {
                    fetcher.presenter(payload);
                });

                it('expose carousel items on scope', function() {
                    expect(scope.carousel.items).toEqual([
                        {index:0, path:'carousels/carousel-name/0.img'}
                    ]);
                });
            });
        });

        describe('on edit', function () {
            beforeEach(function () {
                scope.edit();
            });

            it('editable mode enabled', function () {
                expect(scope.editable).toEqual(true);
            });
        });

        describe('on submit', function () {
            describe('perform', function () {
                beforeEach(function () {
                    scope.new = {length:3};
                    scope.carousel = {
                        name: '/carousel/name'
                    };
                    scope.submit();
                });

                it('perform PUT request', function () {
                    expect(updater.scope).toEqual(scope);
                    expect(updater.carousel).toEqual({
                        name: scope.carousel.name,
                        length: scope.carousel.length
                    });
                });

                describe('success', function() {
                    beforeEach(function() {
                        updater.success();
                    });

                    it('update items', function() {
                        expect(scope.carousel.items.length).toEqual(3);
                    });
                });
            });

            describe('ensure length', function () {
                it('is converted from string to int', function () {
                    scope.new = {length:'3'};
                    scope.carousel = {};
                    scope.submit();
                    expect(updater.carousel.length).toEqual(3);
                });
            });
        });
    });
});