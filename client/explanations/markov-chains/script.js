

myApp.controller('NoControlsCtrl', function($scope) {
  $scope.states = [
    { label: 'A', index: 0 },
    { label: 'B', index: 1 }
  ];

  $scope.diagramCenter = [0.5, 0.5];
  
  $scope.speedRange = 2;
  $scope.$watch('speedRange', function(speed) {
    $scope.duration = 2000 / +speed;
  });

  $scope.transitionMatrix = [
    [0.5, 0.5],
    [0.5, 0.5]
  ];
});

myApp.controller('TransitionMatrixCtrl', function($scope, utils, $window) {
  angular.element($window).on('resize', function() { $scope.$apply(); });
  $scope.diagramCenter = [0.5, 0.5];
  $scope.selected = { transition: null };
  $scope.color = d3.scale.category10();
  $scope.isSelectedTransition = function(i, j) {
    return !!$scope.selected.transition;
  };
  $scope.states = [
    { label: 'A', index: 0 },
    { label: 'B', index: 1 }
  ];
  $scope.speedRange = 2;
  $scope.$watch('speedRange', function(speed) {
    $scope.duration = 2000 / +speed;
  });

  $scope.transitionMatrix = [
    [0.5, 0.5],
    [0.5, 0.5]
  ];

  $scope.onChangeMatrixValue = function(idx1, idx2) {
    utils.normalizeTransitionMatrix($scope.transitionMatrix, idx1, idx2);
  };
});


myApp.controller('RandomSequenceCtrl', function($scope, utils, $window, $interval) {
  angular.element($window).on('resize', function() { $scope.$apply(); });
  var c = 0;
  var s = ['R', 'S'];
  var t = [ [0.9, 0.2], [0.2, 0.9] ];
  var color = d3.scale.category10();
  $interval(function() {
    c = utils.sample(t[c]);
    $scope.$broadcast('stateChange', { text: s[c], color: color(s[c]) });
  }, 500);
});

myApp.controller('RandomSequenceCtrl50', function($scope, utils, $window, $interval) {
  angular.element($window).on('resize', function() { $scope.$apply(); });
  var s = ['R', 'S'];
  var color = d3.scale.category10();
  $interval(function() {
    var c = Math.random() < 0.5 ? 1 : 0;
    $scope.$broadcast('stateChange', { text: s[c], color: color(s[c]) });
  }, 500);
});


myApp.controller('RandomSequenceMarkovCtrl', function($scope, utils, $window) {
  angular.element($window).on('resize', function() { $scope.$apply(); });
  $scope.diagramCenter = [0.8, 0.5];
  $scope.state = { current: null };
  $scope.selected = { transition: null };
  var labels = ['R', 'S'];
  var color = d3.scale.category10();
  $scope.states = labels.map(function(label, i) {
    return { text: label, label: label, index: i, color: color(label) };
  });
  $scope.transitionMatrix = [
    [0.9, 0.1],
    [0.1, 0.9]
  ];
  $scope.duration = 1000;
  $scope.speedRange = 2;
  $scope.$watch('speedRange', function(speed) {
    $scope.duration = 2000 / +speed;
  });
});