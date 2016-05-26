angular.module('toggle.edit.mode', [])
    .service('editModeRenderer', function () {
        return jasmine.createSpyObj('editModeRenderer', ['open', 'close']);
    })
    .service('editMode', function () {
        return jasmine.createSpyObj('editMode', ['bindEvent']);
    });