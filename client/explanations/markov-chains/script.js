

myApp.controller('NoControlsCtrl', function($scope) {
  $scope.states = [
    { label: 'A', index: 0 },
    { label: 'B', index: 1 }
  ];

  $scope.diagramCenter = [0.40, 0.5];
  
  $scope.speedRange = 2;
  $scope.$watch('speedRange', function(speed) {
    $scope.duration = 2000 / +speed;
  });

  $scope.transitionMatrix = [
    [0.5, 0.5],
    [0.5, 0.5]
  ];
});