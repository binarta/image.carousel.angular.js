angular.module('image-management', [])
    .service('imageManagement', function () {
        return jasmine.createSpyObj('imageManagement', ['fileUpload', 'triggerFileUpload', 'validate', 'upload']);
    });