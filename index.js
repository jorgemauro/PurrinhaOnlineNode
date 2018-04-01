var server = require('ws').Server;
var s= new server({port: process.env.PORT || 5000});

s.on('connection',(ws)=>{
    ws.on('message',(m)=>{
        m=JSON.parse(m);
        if(m.type=="novaPartida"){
            s.contaNova++;
            ws.totalPalitos=3;
            ws.rodada=1;
            ws.palito=-1;
            if(s.contaNova==3){
                s.clients.forEach((cliente)=>{
                    cliente.send(JSON.stringify({
                        palito: true,
                        data: m.data,
                        total:ws.totalPalitos,
                    }));
                });
                return;
            }
            return;
        }
        if(m.type=="name"){
            ws.personName=m.data;
            ws.totalPalitos=3;
            ws.rodada=1;
            ws.palito=-1;
            if(s.clients.size==3){
                s.clients.forEach((cliente)=>{
                    cliente.send(JSON.stringify({
                        palito: true,
                        data: m.data,
                        total:ws.totalPalitos,
                    }));
                });
                return;
            }
            return;
        }
        if(m.type=="palito"){
                ws.palito=m.data;
                ws.send(JSON.stringify({
                    aposta: true,
                    data: m.data
                }));
                return;
        }
        if(m.type=='aposta'){
            let soma=0;
            let msg='';
            let msgvenc='';
            let fim=false;
            let contador=0;
            let condicaoVitoria=false;
            ws.aposta=m.data;
            s.clients.forEach((cliente)=>{
            if(cliente.palito!=-1){
                    soma+=parseInt(cliente.palito);
                    msg+='<b>'+cliente.personName+" colocou :</b> "+cliente.palito+"<br/>";
                    if(cliente.aposta)
                        contador++;
                    } 
                });
                if(contador==3){
                    msg+='Vencedores da rodada: <br/>'
                    s.clients.forEach((cliente)=>{
                    if(cliente.aposta==soma){
                        cliente.rodada++;
                        msg+=cliente.personName+' <br/>';
                        cliente.totalPalitos--;
                        if(cliente.totalPalitos==0){
                            condicaoVitoria=true;
                        }    
                    }
                });
                if(condicaoVitoria){
                    msg='';
                    s.clients.forEach((cliente)=>{
                        if(cliente.totalPalitos == 0){
                            msg+=cliente.personName;
                        }
                    });
                    fim=true;
                    msg+='  <b>Venceu!!!</b>'
                }
                if(fim){
                    
            s.contaNova=0;
                        s.clients.forEach((cliente)=>{
                            cliente.send(JSON.stringify({
                                fim: true,
                                msg: msg,
                            }));
                        });
                        return;
                }else{
                        s.clients.forEach((cliente)=>{
                            cliente.palito=-1;
                            cliente.send(JSON.stringify({
                                rodada: 'rodada '+cliente.rodada+' - você ainda tem '+cliente.totalPalitos+' palitos',
                                proximarodada: true,
                                data: msg
                            }));
                        });
                        return;
                }
            }else{
                ws.send(JSON.stringify({
                    rodada:ws.rodada,
                    proximarodada: true,
                    data: false
                }));
                return;
            }
        }
    });
    ws.on('close', ()=>{
        console.log('Perdi um cliente');
        s.clients.delete;
    });
});