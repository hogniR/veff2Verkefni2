var ChatClient = angular.module('ChatClient', ['ngRoute']);

ChatClient.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', { templateUrl: 'Views/login.html', controller: 'LoginController' })
			.when('/rooms/:user/', { templateUrl: 'Views/rooms.html', controller: 'RoomsController' })
			.when('/room/:user/:room/', { templateUrl: 'Views/room.html', controller: 'RoomController' })
			.otherwise({
	  			redirectTo: '/login'
			});
	}
);

ChatClient.controller('LoginController', function ($scope, $location, $rootScope, $routeParams, socket) {
	
	$scope.errorMessage = '';
	$scope.nickname = '';

	$scope.login = function() {			
		if ($scope.nickname === '') {
			$scope.errorMessage = 'Please choose a nick-name before continuing!';
		} else {
			socket.emit('adduser', $scope.nickname, function (available) {
				if (available) {
					$location.path('/rooms/' + $scope.nickname);
				} else {
					$scope.errorMessage = 'This nick-name is already taken!';
				}
			});			
		}
	};
});

ChatClient.controller('RoomsController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.rooms = [];
	$scope.currentUser = $routeParams.user;
	$scope.createRoom = function(){
		socket.emit('joinroom', {room: $scope.roomName}, function (success, reason){
			if(!success){
				console.log(reason);
			}
		});
		$scope.roomName = "";
	};
	socket.on('roomlist', function (activeRooms){
		if(activeRooms !== null){
			$scope.rooms = Object.keys(activeRooms);
		}
		
	});
	socket.emit('rooms');
});

ChatClient.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.currentUsers = [];
	$scope.errorMessage = '';
	
	$scope.messages = [];

	$scope.addMessage = function(){
		socket.emit('sendmsg', {roomName: $scope.currentRoom, msg: $scope.newMessage});
		$scope.newMessage = "";
		socket.on('updatechat', function (roomName, history){
			if(roomName === $routeParams.room){
				$scope.messages = history;
			}  
		});	
	};
	
	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === $routeParams.room){
			$scope.currentUsers = users;
		}
	});		

	socket.emit('joinroom', {room: $scope.currentRoom}, function (success, reason) {
		if (!success)
		{
			$scope.errorMessage = reason;
		}
	});
});