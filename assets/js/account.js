
window.onload =function(){

		$('#form').berry({
			name: 'account_form',
			legend: 'Account Settings',
			actions:['save'],
			inline:true,
			attributes: userdata, 
			fields: {
				'Username': {}
			} 
		}).on('save', function(){


			$.ajax({
	  				type: "POST",
					  url: '/account',
					  data: {user:this.toJSON()},
					  success: function(){
					  	toastr.success('Account Updated Successfully')
					  },
					  error: function(){
					  	toastr.error('There was an error updating your Account')
					  }
					  // dataType: dataType
					});


		})

		$('#change_password').berry({
			name: 'password',
			legend: 'Change Password',
			actions:['save'],
			inline:true,
			// attributes: userdata,
			fields: {
				// 'Old Password': {type:'password'},				
				'New Password': {type:'password'},
				// 'New Password Again': {type:'password'}


			} 
		}).on('save', function(){
			if(this.validate()){
				$.ajax({
	  				type: "POST",
					  url: '/password',
					  data: this.toJSON(),
					  success: function(){
					  	toastr.success('Password Updated Successfully')
					  },
					  error: function(){
					  	toastr.error('There was an error updating your Password')
					  }
					  // dataType: dataType
					});
			}

		})
	}