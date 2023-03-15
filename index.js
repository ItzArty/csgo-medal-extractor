
Array.prototype.last = function( ) {

	return this[ this.length - 1 ];

}

const fs = require( 'fs' );
const vpk = require( 'vpk' );
const path = require( 'path' );
const Jimp = require( 'jimp' );
const svdf = require( 'simple-vdf' );

const csgoPath = process.argv[ 2 ];

if( !fs.existsSync( './icons/' ) ) fs.mkdirSync( './icons/' );

const itemDictionary = svdf.parse( fs.readFileSync( path.join( csgoPath, 'csgo', 'scripts', 'items', 'items_game.txt' ) ).toString( ) ).items_game.items;

const archive = new vpk( path.join( csgoPath, 'csgo', 'pak01_dir.vpk' ) );
archive.load( );

let statusIcons = archive.files.filter( path => path.startsWith( 'resource/flash/econ/status_icons' ) );

statusIcons = statusIcons.filter( icon => {

	if( !icon.startsWith( 'resource/flash/econ/status_icons' ) ) return false;

	const iconSizing = icon.split( '/' ).last( ).split( '.' )[ 0 ].split( '_' ).last( );

	const size = iconSizing == 'small' || iconSizing == 'large' ? iconSizing : 'regular';

	let name = icon.split( '/' ).last( ).split( '.' )[ 0 ].split( '_' );
	if( size == 'large' || size == 'small' ) name.pop( );
	name = name.join( '_' );

	if( size == 'large' ) return true;

	if( size == 'regular' && !statusIcons.some( x => x.includes( `${ name }_large.png` ) ) ) return true;

	if( size == 'small' && !statusIcons.some( x => x.includes( `${ name }_large.png` ) ) && !statusIcons.some( x => x.includes( `${ name }.png` ) ) ) return true;

	return false;

} );

statusIcons.forEach( statusIcon => {

	let rName = statusIcon.split( '/' ).last( ).split( '.' )[ 0 ].split( '_' );
	if( rName.last( ) == 'large' || rName.last( ) == 'small' ) rName.pop( );
	rName = rName.join( '_' );

	for( const item in itemDictionary ) {

		if( itemDictionary[ item ].image_inventory ) {

			if( itemDictionary[ item ].image_inventory == `econ/status_icons/${ rName }` ) {

				Jimp.read( archive.getFile( statusIcon ), ( err, image ) => {

					if( err ) {

						console.error( err );

						return;

					}

					const width = image.bitmap.width;
					const height = image.bitmap.height;

					let top = null;
					let left = null;
					let right = null;
					let bottom = null;

					let hadTransparent = false;

					for( let y = 0; y <= height; y++ ) {

						let isTransparent = true;

						for( let x = 0; x <= width; x++ ) {

							if( Jimp.intToRGBA( image.getPixelColor( x, y ) ).a != 0 ) {

								isTransparent = false;
								break;

							}

						}

						if( !isTransparent && hadTransparent ) {

							top = y;
							break;

						} else {

							hadTransparent = true;

						}

					}

					hadTransparent = false;

					for( let y = height; y >= 0; y-- ) {

						let isTransparent = true;

						for( let x = 0; x <= width; x++ ) {

							if( Jimp.intToRGBA( image.getPixelColor( x, y ) ).a != 0 ) {

								isTransparent = false;
								break;

							}

						}

						!isTransparent && hadTransparent ? bottom = y : hadTransparent = true;

					}

					hadTransparent = false;

					for( let x = 0; x <= width; x++ ) {

						let isTransparent = true;

						for( let y = 0; y <= height; y++ ) {

							if( Jimp.intToRGBA( image.getPixelColor( x, y ) ).a != 0 ) {

								isTransparent = false;
								break;

							}

						}

						if( !isTransparent && hadTransparent ) {

							left = x;
							break;

						} else {

							hadTransparent = true;

						}

					}

					hadTransparent = false;

					for( let x = width; x >= 0; x-- ) {

						let isTransparent = true;

						for( let y = 0; y <= height; y++ ) {

							if( Jimp.intToRGBA( image.getPixelColor( x, y ) ).a != 0 ) {

								isTransparent = false;
								break;

							}

						}

						!isTransparent && hadTransparent ? right = x : hadTransparent = true;

					}

					if( !top ) top = 0;
					if( !left ) left = 0;
					if( !right ) right = 0;
					if( !bottom ) bottom = 0;

					const x = width - left - right;
					const y = height - top - bottom;

					image.crop( left, top, x, y );

					const size = Math.max( x, y );

					const newImage = new Jimp( size, size, 0x00000000 );

					const newX = Math.floor( ( size / 2 ) - ( x / 2 ) );
					const newY = Math.floor( ( size / 2 ) - ( y / 2 ) );

					newImage.composite( image, newX, newY );

					newImage.write( `./icons/${ item }.png` );

				} );

				console.log( `Extracted file ${ item } (${ statusIcon })` );

			}

		}

	}

} );