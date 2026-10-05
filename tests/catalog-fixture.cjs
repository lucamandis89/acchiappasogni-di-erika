// Isolated test data, never loaded by the application or published as real assets.
const ringPrices={4:2,6:2.5,8:3,10:4,12:5,14:6,16:7,20:8,22:9,24:10,27:12,30:15,37:18,70:30};
const rings=Object.entries(ringPrices).map(([d,p])=>({id:'r'+d,name:'Cerchio '+d+' cm',type:'ring',image:'assets/icon-192-1.png',price_modifier:p,active:true,metadata:{diameter_cm:Number(d),semantic_role:'ring'}}));
const other=[
 {id:'pink',name:'Piuma rosa',type:'feather',price_modifier:'0,50',metadata:{color:'rosa'}},
 {id:'white',name:'Piuma bianca',type:'feather',price_modifier:0.5,metadata:JSON.stringify({color:'bianco'})},
 {id:'wood',name:'Perlina di legno',type:'bead',price_modifier:0.2,metadata:{material:'legno'}},
 {id:'moon',name:'Luna',type:'moon',price_modifier:0.5,metadata:{themes:['nascita']}},
 {id:'flower',name:'Fiore',type:'flower',price_modifier:0.5,metadata:{themes:['matrimonio']}},
];
module.exports=[...rings,...other];
