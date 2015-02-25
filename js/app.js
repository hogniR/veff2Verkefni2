var ChatClient = angular.module('ChatClient', ['ngRoute']);

ChatClient.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', { templateUrl: 'Views/login.html', controller: 'LoginController' })
			.when('/rooms/:user/', { templateUrl: 'Views/rooms.html', controller: 'RoomsController' })
			.when('/room/:user/:room/', { templateUrl: 'Views/room.html', controller: 'RoomController' })
			.when('/room/:user/:room/:privateUser', { templateUrl: 'Views/room.html', controller: 'PrivateRoomController' })
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
	$scope.currentRoom = $routeParams.room;
	$scope.errorMessage = '';
	$scope.addRoom = function(){
		socket.emit('joinroom', {room: $scope.newRoom}, function (success, reason) {
			if (!success){
				$scope.errorMessage = reason;
			}
			else{
				console.log($scope.newRoom);
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

	$scope.newRoom = "";
	socket.on('roomlist', function(activeRooms){
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
	$scope.privateMessages = [];
	$scope.sendPrivateMsg = false;
	$scope.privateUser = ''

	$scope.addMessage = function(){
		if($scope.newMessage !== ""){
			socket.emit('sendmsg', {roomName: $scope.currentRoom, msg: $scope.newMessage});
			$scope.newMessage = "";
			socket.on('updatechat', function (roomName, history){
				if(roomName === $routeParams.room){
					$scope.messages = $scope.privateMessages.concat(history);
				}  
			});	
		}
	};

	socket.on('userlist', function(currentUsers){
		console.log(currentUsers);
	});
	
	socket.emit('users');
	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === $routeParams.room){
			$scope.currentUsers = users;
		}
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
	};

	socket.on('kicked', function (roomName, kickedUser, user) {
		console.log(kickedUser);
		console.log('trololo');
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
	};

	$scope.partRoom = function (user) {
		$scope.currentUser = user;
		socket.emit('partroom', {room: $scope.currentRoom});
	};
	$scope.sendPrivateMessage = function (user) {
		$scope.sendPrivateMsg = true;
		$scope.privateUser = user;
	};
	$scope.emitPrivateMessage = function () {
		console.log($scope.privateMessage);
		if($scope.privateMessage !== "" ){
			socket.emit('privatemsg', {nick: $scope.privateUser, message: $scope.privateMessage}, function (success) {
				if(!success){
					$scope.errorMessage = "Error";
				}
			});
			$scope.privateMessage = "";
			$scope.sendPrivateMsg = false;
		}
	};
	socket.on('recv_privatemsg', function (nick, message){
		message += " (Private Message)";
		var messageObj = {
			nick: nick,
			timestamp: new Date(),
			message : message.substring(0, 200)
		};
		$scope.privateMessages.push(messageObj);
	});
	/*$scope.sendPrivateMessage = function (user) {
		console.log('/room/' + $scope.currentUser + '/' + $scope.currentRoom + '/' + user);
		$location.path('/room/' + $scope.currentUser + '/' + $scope.currentRoom + '/' + user);
	}
	socket.on('recv_privatemsg', function (nick, message){
		$location.path('/room/' + $scope.currentUser + '/' + $scope.currentRoom + '/' + nick);
	});*/
});

/*ChatClient.controller('PrivateRoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.privateUser = $routeParams.privateUser;
	$scope.currentUsers = [];
	$scope.privateRooms = [];
	$scope.errorMessage = '';
	$scope.messages = [];
	$scope.privateRooms.push($scope.privateUser);
	$scope.currentUsers.push($scope.currentUser);
	$scope.currentUsers.push($scope.privateUser);

	//socket.emit('joinroom', {room: $scope.privateUser}, function (success, reason) {
	//	if (!success){
	//		$scope.errorMessage = reason;
	//	}
	//	else{
	//		$scope.currentUser.push(user);
	//	}
	//});
	$scope.addMessage = function(){
		console.log($scope.newMessage);
		if($scope.newMessage !== "" ){
			socket.emit('privatemsg', {nick: $scope.privateUser, message: $scope.newMessage}, function (success) {
			if(!success){
				$scope.errorMessage = "Error";
			}
		});
		$scope.newMessage = "";
		}
		socket.on('recv_privatemsg', function (nick, message){
			console.log(message);
			$scope.messages.push(message);
			$scope.currentUsers.push(nick);
		});
	}
});*/















