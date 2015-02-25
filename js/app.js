var ChatClient = angular.module('ChatClient', ['ngRoute']);

ChatClient.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', { templateUrl: 'Views/login.html', controller: 'LoginController' })
			.when('/rooms/:user/', { templateUrl: 'Views/rooms.html', controller: 'RoomsController' })
			.when('/room/:user/:room/', { templateUrl: 'Views/room.html', controller: 'RoomController' })
			.when('/logoff', { controller: 'LogoffController' })
			.otherwise({
	  			redirectTo: '/login'
			});
	}
);

ChatClient.controller('LogoffController', function ($scope, socket, $location) {
	$scope.logoff = function () {
		socket.emit('logoff');
		$location.path('/login');
	}
});

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
	$scope.currentRoom = $routeParams.room;
	$scope.errorMessage = '';
	$scope.userCount = [];

	$scope.addRoom = function(){
		socket.emit('joinroom', {room: $scope.newRoom}, function (success, reason) {
			if (!success){
				$scope.errorMessage = reason;
			}
			else{
				$location.path('/room/' + $scope.currentUser  + '/' +  $scope.newRoom );
			}
		});
	};

	$scope.joinRoom = function(currRoom){
		socket.emit('joinroom', {room: currRoom}, function (success, reason) {
			if(!success){
				$scope.errorMessage = reason;
			}
			else{
				$location.path('/room/' + $scope.currentUser  + '/' +  currRoom );
			}
		});
	}

	$scope.newRoom = ""
	socket.on('roomlist', function(activeRooms){
		if(activeRooms !== null){
			$scope.rooms = Object.keys(activeRooms);
		}
	})

	socket.on('userlist', function (userlist) {
		$scope.userCount = userlist.length;
	});
	socket.emit('users');

	socket.emit('rooms');
});

ChatClient.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.currentUsers = [];
	$scope.errorMessage = '';
	
	$scope.messages = [];

	$scope.partRoom = function () {
		socket.emit('partroom', $scope.currentRoom);
		$location.path('/rooms/' + $scope.currentUser);
	};

	$scope.addMessage = function(){
		if($scope.newMessage !== ""){
			socket.emit('sendmsg', {roomName: $scope.currentRoom, msg: $scope.newMessage});
			$scope.newMessage = "";	
		}
	};
	
	socket.emit('users');

	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === $routeParams.room){
			$scope.currentUsers = users;
		}
	});	

	socket.on('updatechat', function (roomName, history){
		if(roomName === $routeParams.room){
			$scope.messages = history;
		}
		$('#chat').animate(
			{scrollTop: $(document).height() + 5000}, "fast");
	});

	socket.emit('joinroom', {room: $scope.currentRoom}, function (success, reason) {
		if (!success){
			$location.path('/rooms/' + $scope.currentUser);
			$scope.errorMessage = reason;
		}
	});

	$scope.kickUser = function (user) {
		socket.emit('kick', {room: $scope.currentRoom, user: user}, function (success){
			if(!success){
				$scope.errorMessage = "You must be the creator of this group to kick users";
			}
		});
	}

	socket.on('kicked', function (roomName, kickedUser, user) {
		if($scope.currentUser === kickedUser){
			$location.path('/rooms/' + $scope.currentUser)
		}
	});	

	$scope.banUser = function (user) {
		socket.emit('ban', {room: $scope.currentRoom, user: user}, function (success){
			if(!success){
				$scope.errorMessage = "You must be the creator of this group to ban users";
			}
		});
	}

	

	//$scope.sendPrivateMessage = function (user) {
	//	$scope.emit('privatemsg', {nick: user, mess})
	//}
});
















