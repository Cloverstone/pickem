window.onload =function(){

	templates['available'] = Hogan.compile(available, templates);

	templates['berry_gamePick'] = Hogan.compile(gamePick, templates);

	var n = [];
	var min = 17-data.length;
	var max = 16;

	var min = 1;
	var max = data.length;

	for(var i=min;i<=max;i++){
		n.push(i);
	}
	$('.games').html(templates['available'].render({percent: 100/((max-min)+1),values: n}));
	
	_.map(data, function(datum){datum.id = datum._id;return datum;})
	

	var value = '0';
	if(limited){
		value = 1;
	}
	$('#form').berry({
		name: 'picks_form',
		actions:['save'],
		default:{type: 'gamePick', min: min, max: max, default:{label: 'Choose', value: value}, required: true, value:{points: 0}},
		attributes: _.keyBy(picks, 'id'), 
		fields: data 
	}).on('change', function(){

		$('.games span').removeClass('text-success text-danger');
		this.usedValues = _.values(_.mapValues(this.toJSON(), function(o) { return parseInt(o.points, 10); }));
		this.usedValues.map(function(value){
			if(!$('.games #point'+value).hasClass('text-danger')){
			if($('.games #point'+value).hasClass('text-success')){
				$('.games #point'+value).removeClass('text-success');
				$('.games #point'+value).addClass('text-danger');
			}else{
				$('.games #point'+value).addClass('text-success');
			}
			}

		});
		if(!this.valid){
			this.validate();	
		}
	}).on('save', function(){

		if(this.validate()){
			submitPicks();
		}else{
			mymodal = modal({title:"Warning",content:"You have some errors in your picks are you sure you want to proceed?",modal:{header_class:"bg-warning"}, footer: '<span class="btn btn-danger" onclick="mymodal.ref.modal(\'hide\')">Cancel</span><span class="btn btn-success" onclick="submitPicks()">Save</span>'})
		}
	}).trigger('change');
	
}
submitPicks = function(){
if(mymodal){mymodal.ref.modal('hide');}
$.ajax({
	  				type: "POST",
					  url: '/picks/'+week,
					  data: {changed:_.values(Berries.picks_form.toJSON(null, true))},
					  success: function(){
					  	toastr.success('Picks saved Successfully')
					  },
					  error: function(){
					  	toastr.error('There was an error saving your Picks')
					  }
					  // dataType: dataType
					});
}

var available = `<div>{{#values}}<span class="cube" style="width:{{percent}}%" id="point{{.}}">{{.}}</span>{{/values}}</div>`;

var gamePick = `
<div class="row clearfix {{modifiers}}" name="{{id}}" data-type="{{type}}" style="margin-bottom: 1px;padding:5px">
	<div class="col-md-5 col-xs-4" style="text-align:right">
		<div class="btn btn-none btn-team" data-value="{{{away._id}}}"><span class="awayteam hidden-sm hidden-md hidden-lg">{{{away.abbreviation}}}</span><span class="awayteam hidden-xs">{{{away.name}}}</span><span class="cube team-icon {{away.name}} {{away.location}}" style="margin:-5px;float:right"></span></div>
	</div>
	<div class="col-md-2 col-xs-4" >
	<select class="form-control"  name="{{id}}" {{^isEnabled}}readonly disabled="true"{{/isEnabled}}  {{#multiple_enable}}multiple{{/multiple_enable}} >
	{{#options}}
		<option {{#selected}}selected='selected'{{/selected}} value="{{value}}">
			{{label}}
		</option>
	{{/options}}
	</select>
	</div>
	<div class="col-md-5 col-xs-4" style="text-align:left">
		<div class="btn btn-none btn-team" data-value="{{{home._id}}}"><span class="cube team-icon {{home.name}}  {{home.location}}" style="margin:-5px;float:left"></span><span class="hometeam hidden-xs">{{{home.name}}}</span><span class="hometeam hidden-sm hidden-md hidden-lg">{{{home.abbreviation}}}</span></div>
	</div>
</div>`;
