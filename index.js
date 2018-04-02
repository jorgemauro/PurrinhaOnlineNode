var server = require('ws').Server;
var port = process.env.PORT || 5000;
// define a quantidade de jogadores na partida
var qtjogadores=3;
// defino o inicio do server
var s= new server({port: port});
//quando houver uma nova conexão ao server ele vai ser atribuido aqui
s.on('connection',(ws)=>{
    console.log("entrou um Jogador")
    //aqui ele espera uma mensagem do socket que se conectou a ele
    ws.on('message',(m)=>{
        // tranforma a mensagem recebida pelo servidor em objeto json
        m=JSON.parse(m);
        // verifica se é a mensagem de uma nova partida
        if(m.type=="novaPartida"){
            s.contaNova++;
            ws.totalPalitos=3;
            ws.rodada=1;
            ws.palito=-1;
            if(s.contaNova==qtjogadores){
                s.clients.forEach((cliente)=>{
                    cliente.send(JSON.stringify({
                        palito: true,
                        data: m.data,
                        total:ws.totalPalitos,
                        rodada: 'rodada '+cliente.rodada+' - você ainda tem '+cliente.totalPalitos+' palitos   ',
                        jogadores: cliente.personName+' há '+s.clients.size+' Jogadores',
                    }));
                });
                return;
            }
            return;
        }
        // verifica se a menssagem é o nome do jogador, atribui ao socket o nome
        if(m.type=="name"){
            console.log("O novo jogador é "+m.data);
            ws.personName=m.data;
            ws.totalPalitos=3;
            ws.rodada=1;
            ws.palito=-1;
            if(s.clients.size==qtjogadores){
                s.clients.forEach((cliente)=>{
                    cliente.send(JSON.stringify({
                        palito: true,
                        data: m.data,
                        total:ws.totalPalitos,
                        rodada: 'rodada '+cliente.rodada+' - você ainda tem '+cliente.totalPalitos+' palitos   ',
                        jogadores: cliente.personName+' há '+qtjogadores+' Jogadores',
                    }));
                });
                return;
            }
            return;
        }
        //verifica se o envio da mensagem são os palitos que ele deseja mostrar
        if(m.type=="palito"){
            console.log("O jogador "+ws.personName+" mostrou: "+m.data+" palito(s)");
                ws.palito=m.data;
                //envia mensagem ao cliente
                ws.send(JSON.stringify({
                    aposta: true,
                    data: m.data
                }));
                return;
        }
        // verifica se o tipo da mensagem é sobre a aposta
        if(m.type=='aposta'){
            let soma=0;
            let msg='';
            let msgvenc='';
            let fim=false;
            let contador=0;
            let condicaoVitoria=false;
            ws.aposta=m.data;
            console.log("O jogador "+ws.personName+" apostou: "+ws.aposta);
            // se todos os cliente enviaram suas apostas ele retorna para todos a mensagem da rodada
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
                // verifica se algum dos jogadores perderam todos os palitos
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
                            cliente.aposta=false;
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
    // se a mensagem enviada foi de desconexão ele executa
    ws.on('close', ()=>{
        console.log('Perdi um cliente');
        s.clients.delete;
    });
});