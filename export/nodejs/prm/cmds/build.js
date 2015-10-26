'use strict';

var fs = require('fs');
var crawler = require('../../crawler');
var path = require('path');
var runtime = require('../lib/runtime');
var options;
var args;

module.exports = function(argv) {
  args = argv;
  options = verify(argv);

  crawler(options.data, {parseCsv : false}, onCrawlComplete);
};

function onCrawlComplete(results){
  var dssPenalties = {
    path : path.join(options.output || getUserHome(), options.prefix+'PD.dss'),
    data : []
  };

  for( var i = 0; i < results.nodes.length; i++ ) {
    var node = results.nodes[i];

    if( node.properties.costs ) {
      addCost(dssPenalties.data, node);
    }
  }

  console.log('Writing Penalties DSS file: '+dssPenalties.path);
  runtime(options.runtime, dssPenalties, function(err, resp){
    if( err ) {
      console.log('ERROR: writing to dss file.');
      console.log(err);
    }
    console.log('Done.');

    if( args.verbose ) {
      console.log(resp.stack);
    }
  });
}

function addCost(dataArray, node) {
  var costs = node.properties.costs;

  if( costs.type === 'Monthly Variable' ) {
    for( var month in costs.costs ) {
      var file = costs.costs[month];
      if( !fs.existsSync(file) ) {
        console.log('WARNING: '+file+' does not exist');
      }

      dataArray.push({
        csvFilePath : file,
        type : 'paired',
        label : month,
        date : month,
        location : node.properties.prmname,
        xunits : 'KAF',
        xtype : 'DIVR',
        yunits : 'Penalty',
        ytype : '',
        path : '//'+node.properties.prmname+'///'+month+'/1/'
     });
    }
  }
}

function verify(argv) {
  var options = {
    prefix : '',
    runtime : '',
    data : ''
  };

  if( argv._.length > 0 ) {
    options.prefix = argv._[0];
  } else if( argv.prefix ) {
    options.prefix = argv.prefix;
  }

  if( argv.r ) {
    options.runtime = argv.r;
  } else if( argv.runtime ) {
    options.runtime = argv.runtime;
  }

  if( argv.d ) {
    options.data = argv.d;
  } else if( argv.data ) {
    options.data = argv.data;
  }

  if( argv.output ) {
    options.output = argv.output;
  }

  for( var key in options ) {
    if( !options[key] ) {
      console.log('Missing '+key);
      process.exit(-1);
    }
  }

  if( !fs.existsSync(options.runtime) ) {
    console.log('Invalid runtime path: '+options.runtime);
    process.exit(-1);
  } else if( !fs.existsSync(options.data) ) {
    console.log('Invalid data repo path: '+options.data);
    process.exit(-1);
  }

  return options;
}

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
