describe('image carousel', function () {
    beforeEach(module('image.carousel'));

    var $rootScope;
    var initialItems = [
        {
            id: '/item/id/3.img',
            priority: 3
        }, {
            id: '/item/id/1.img',
            priority: 1
        }, {
            id: '/item/id/2.img',
            priority: 2
        }
    ];
    var images = [
        {
            path: 'item/id/1.img',
            id: '/item/id/1.img',
            priority: 1
        }, {
            path: 'item/id/2.img',
            id: '/item/id/2.img',
            priority: 2
        }, {
            path: 'item/id/3.img',
            id: '/item/id/3.img',
            priority: 3
        }
    ];

    beforeEach(inject(function (_$rootScope_) {
        $rootScope = _$rootScope_;
    }));

    describe('binImageCarousel service', function () {
        var sut, imageManagement;

        beforeEach(inject(function (binImageCarousel, _imageManagement_) {
            sut = binImageCarousel;
            imageManagement = _imageManagement_;
        }));

        describe('on get images', function () {
            var images;

            describe('with initial items', function () {
                beforeEach(function () {
                    images = sut.getImages({prefetchedItems: initialItems});
                });

                it('items are ordered and image paths are added', function () {
                    expect(images).toEqual(images);
                });
            });
        });

        describe('on get hero image', function () {
            var image;

            describe('when no items', function () {
                beforeEach(function () {
                    image = sut.getHeroImage({prefetchedItems: []});
                });

                it('no hero image', function () {
                    expect(image).toBeUndefined();
                });
            });

            describe('with initial items', function () {
                beforeEach(function () {
                    image = sut.getHeroImage({prefetchedItems: initialItems});
                });

                it('hero image is available', function () {
                    expect(image).toEqual(initialItems[1]);
                });
            });
        });

        describe('on add image', function () {
            var uploadDeferred, addImageResolved, addImageRejected;

            beforeEach(inject(function ($q) {
                addImageResolved = undefined;
                addImageRejected = undefined;

                uploadDeferred = $q.defer();
                imageManagement.upload.and.returnValue(uploadDeferred.promise);

                sut.addImage({
                    carouselId: '/carousel/id'
                }).then(function (result) {
                    addImageResolved = result;
                }, function (violations) {
                    addImageRejected = violations;
                });
            }));

            it('fileUpload is set up', function () {
                expect(imageManagement.fileUpload).toHaveBeenCalledWith({
                    dataType: 'json',
                    add: jasmine.any(Function)
                });
            });

            it('fileUpload is triggered', function () {
                expect(imageManagement.triggerFileUpload).toHaveBeenCalled();
            });

            describe('when valid file is selected', function () {
                var file = 'file';

                beforeEach(function () {
                    imageManagement.validate.and.returnValue([]);
                    imageManagement.fileUpload.calls.first().args[0].add(null, file);
                });

                it('file is validated', function () {
                    expect(imageManagement.validate).toHaveBeenCalledWith(file);
                });

                it('image is uploading', function () {
                    expect(imageManagement.upload).toHaveBeenCalledWith({
                        file: file,
                        code: '/carousel/id',
                        imageType: 'foreground',
                        carouselImage: true
                    });
                });

                describe('on upload success', function () {
                    beforeEach(function () {
                        uploadDeferred.resolve({path: 'path/to/image.img'});

                        $rootScope.$digest();
                    });

                    it('image data is returned', function () {
                        expect(addImageResolved).toEqual({
                            path: 'path/to/image.img',
                            id: '/path/to/image.img'
                        });
                    });
                });

                describe('on upload failed', function () {
                    beforeEach(function () {
                        uploadDeferred.reject('upload.failed');

                        $rootScope.$digest();
                    });

                    it('violation is returned', function () {
                        expect(addImageRejected).toEqual(['upload.failed']);
                    });
                });
            });

            describe('when invalid file is selected', function () {
                var file = 'file';
                var violation = ['invalid'];

                beforeEach(function () {
                    imageManagement.validate.and.returnValue(violation);
                    imageManagement.fileUpload.calls.first().args[0].add(null, file);

                    $rootScope.$digest();
                });

                it('violation is returned', function () {
                    expect(addImageRejected).toEqual(violation);
                });
            });
        });

        describe('on delete image', function () {
            var rest, restDeferred, imageDeleted;

            beforeEach(inject(function ($q, restServiceHandler, config) {
                rest = restServiceHandler;
                config.baseUri = 'base/uri/';

                restDeferred = $q.defer();
                rest.and.returnValue(restDeferred.promise);

                sut.deleteImage('/image/id').then(function () {
                    imageDeleted = true;
                });
            }));

            it('rest handler is called', function () {
                expect(rest).toHaveBeenCalledWith({
                    params: {
                        method: 'DELETE',
                        url: 'base/uri/api/entity/catalog-item?id=%2Fimage%2Fid',
                        withCredentials: true
                    }
                });
            });

            it('promise is returned', function () {
                restDeferred.resolve();
                $rootScope.$digest();

                expect(imageDeleted).toBeTruthy();
            });
        });
    });

    describe('binImageCarouselController', function () {
        var $ctrl, scope, element, service, editModeRenderer, topics;
        var addImageDeferred, deleteImageDeferred;
        var carouselId = '/carousel/id', angularSpy, carouselSpy;

        beforeEach(inject(function ($controller, $q, _editModeRenderer_, topicRegistryMock) {
            editModeRenderer = _editModeRenderer_;
            topics = topicRegistryMock;

            addImageDeferred = $q.defer();
            deleteImageDeferred = $q.defer();

            scope = $rootScope.$new();
            element = [{
                querySelector: jasmine.createSpy('spy')
            }];
            carouselSpy = jasmine.createSpyObj('element', ['carousel']);
            angularSpy = spyOn(angular, 'element').and.returnValue(carouselSpy);

            service = jasmine.createSpyObj('binImageCarousel', ['getImages', 'addImage', 'deleteImage']);
            service.getImages.and.returnValue([]);
            service.addImage.and.returnValue(addImageDeferred.promise);
            service.deleteImage.and.returnValue(deleteImageDeferred.promise);

            $ctrl = $controller('binImageCarouselController', {
                $scope: scope,
                $element: element,
                binImageCarousel: service
            }, {
                id: carouselId
            });
        }));

        afterEach(function () {
            angularSpy.and.callThrough();
        });

        it('subscribed to edit.mode event', function () {
            expect($ctrl.editing).toBeFalsy();
            topics['edit.mode'](true);
            expect($ctrl.editing).toBeTruthy();
            topics['edit.mode'](false);
            expect($ctrl.editing).toBeFalsy();
        });

        it('initialize bootstrap carousel', function () {
            expect(element[0].querySelector).toHaveBeenCalledWith('.carousel');
            expect(carouselSpy.carousel).toHaveBeenCalledWith({interval: false});
        });

        it('on next item', function () {
            $ctrl.next();
            expect(carouselSpy.carousel).toHaveBeenCalledWith('next');
        });

        it('on previous item', function () {
            $ctrl.previous();
            expect(carouselSpy.carousel).toHaveBeenCalledWith('prev');
        });

        it('images are requested', function () {
            expect(service.getImages).toHaveBeenCalledWith({
                prefetchedItems: undefined
            });
        });

        describe('on edit', function () {
            beforeEach(function () {
                $ctrl.edit();
            });

            it('add image on service is called', function () {
                expect(service.addImage).toHaveBeenCalledWith({
                    carouselId: carouselId
                });
            });
        });

        describe('with initial items', function () {
            beforeEach(inject(function ($controller) {
                service.getImages.and.returnValue(images);
                $ctrl = $controller('binImageCarouselController', {
                    $scope: scope,
                    $element: element,
                    binImageCarousel: service
                }, {
                    id: carouselId,
                    items: initialItems
                });
            }));

            it('images are requested', function () {
                expect(service.getImages).toHaveBeenCalledWith({
                    prefetchedItems: initialItems
                });
            });

            it('images are on controller', function () {
                expect($ctrl.images).toEqual(images);
            });

            describe('on edit', function () {
                beforeEach(function () {
                    $ctrl.edit();
                });

                it('editModeRenderer is called', function () {
                    expect(editModeRenderer.open).toHaveBeenCalled();
                });

                describe('with renderer scope', function () {
                    var rendererScope;

                    beforeEach(function () {
                        rendererScope = editModeRenderer.open.calls.first().args[0].scope;
                    });

                    it('images are on scope', function () {
                        rendererScope.images = $ctrl.images;
                    });

                    describe('on add image', function () {
                        beforeEach(function () {
                            rendererScope.addImage();
                        });

                        it('working', function () {
                            addImageDeferred.notify();
                            rendererScope.$digest();

                            expect(rendererScope.working).toBeTruthy();
                        });

                        it('add image on service is called', function () {
                            expect(service.addImage).toHaveBeenCalledWith({
                                carouselId: carouselId
                            });
                        });

                        it('on success', function () {
                            var image = {
                                id: '/new/image',
                                path: 'new/image'
                            };

                            addImageDeferred.resolve(image);
                            rendererScope.$digest();

                            expect($ctrl.images[3]).toEqual(image);
                            expect(rendererScope.working).toBeFalsy();
                        });

                        it('on failed', function () {
                            var violations = ['reason'];

                            addImageDeferred.reject(violations);
                            rendererScope.$digest();

                            expect(rendererScope.violations).toEqual(violations);
                            expect(rendererScope.working).toBeFalsy();
                        });

                        describe('when limit is reached', function () {
                            beforeEach(function () {
                                $ctrl.images = [];
                                for(var i = 1; i <= 20; i ++) {
                                    $ctrl.images.push({
                                        path: 'item/id/' + i + '.img',
                                        id: '/item/id/' + i + '.img',
                                        priority: i
                                    });
                                }
                            });

                            it('add image returns violation', function () {
                                rendererScope.addImage();

                                expect(rendererScope.violations).toEqual(['images.upperbound']);
                            });
                        });
                    });

                    describe('on delete image', function () {
                        var image;

                        beforeEach(function () {
                            image = $ctrl.images[0];

                            rendererScope.deleteImage(image);
                        });

                        it('working', function () {
                            expect(rendererScope.working).toBeTruthy();
                        });

                        it('delete image on service is called', function () {
                            expect(service.deleteImage).toHaveBeenCalledWith(image.id);
                        });

                        it('on success', function () {
                            deleteImageDeferred.resolve();
                            rendererScope.$digest();

                            expect($ctrl.images[0]).not.toEqual(image);
                            expect(rendererScope.openedImage).toBeUndefined();
                            expect(rendererScope.working).toBeFalsy();
                        });
                    });

                    it('on open image', function () {
                        rendererScope.openImage('image');

                        expect(rendererScope.openedImage).toEqual('image');
                    });

                    it('on close image', function () {
                        rendererScope.closeImage();

                        expect(rendererScope.openedImage).toBeUndefined();
                    });

                    it('on close', function () {
                        rendererScope.close();

                        expect(editModeRenderer.close).toHaveBeenCalled();
                    });
                });
            });
        });
    });

    describe('binImageCarouselHeroController', function () {
        var ctrl, service, getImagesDeferred;

        beforeEach(inject(function ($controller, $q) {
            getImagesDeferred = $q.defer();
            service = jasmine.createSpyObj('binImageCarousel', ['getHeroImage']);
            service.getHeroImage.and.returnValue('hero');
            ctrl = $controller('binImageCarouselHeroController', {
                binImageCarousel: service
            });
        }));

        describe('on init', function () {
            var args = {
                id: '/carousel/id',
                items: ['item1', 'item2', 'item3']
            };

            beforeEach(function () {
                ctrl.init(args);
            });

            it('get images from service', function () {
                expect(service.getHeroImage).toHaveBeenCalledWith({
                    prefetchedItems: args.items
                });
            });

            it('hero image is available', function () {
                expect(ctrl.image).toEqual('hero');
            });
        });
    });
});
