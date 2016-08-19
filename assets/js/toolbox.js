function render(template, data){
	if(typeof templates[template] === 'undefined'){
		templates[template] =  Hogan.compile($('#'+template).html());
	}
  return templates[template].render(data, templates);
}


debug=true;
alert = function(value){ if(debug){console.log(value);} };


window.onload =function(){
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
	
	if($('#form').length){
		$('#form').berry({
			actions:['save'],
			default:{type: 'gamePick', min: min, max: max, default:{label: 'Choose', value: 0}, required: true, value:{points: 0}},
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
			// debugger;
			var proceed = this.validate();
			if(!this.valid){
				proceed = confirm("You have some errors in your picks are you sure you want to proceed?")
			}
			if(proceed){
				// result = this.toJSON(null, true);


				// changed = _.filter(result,function(item){return !_.isEqual(_.find(picks, {id: item.id}) || {}, item);});

				$.ajax({
	  				type: "POST",
					  url: '/picks/1',
					  data: {changed:_.values(this.toJSON(null, true))},
					  // success: success,
					  // dataType: dataType
					});
			}
		}).trigger('change');
	}
}


var available = `<div>{{#values}}<span class="cube" style="width:{{percent}}%" id="point{{.}}">{{.}}</span>{{/values}}</div>`;
templates['available'] = Hogan.compile(available, templates);


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

templates['berry_gamePick'] = Hogan.compile(gamePick, templates);
