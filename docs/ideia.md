A ideia aqui é criar um "site" / pagina que ajude a gerar o UTM do link do sympla já com base em uma lista pré pronta e conseguir escolher.  

Hoje o processo é manual via pagina: [https://produtores.sympla.com.br/funcionalidades/gerador-de-utm/](https://produtores.sympla.com.br/funcionalidades/gerador-de-utm/)  

O link da planilha base de embaixadores será essa: [https://docs.google.com/spreadsheets/d/1OyoE2ybG9Mcjuw8n4QjfGufPgu1kUjnGYU7Vf1gKopU/edit?gid=0#gid=0](https://docs.google.com/spreadsheets/d/1OyoE2ybG9Mcjuw8n4QjfGufPgu1kUjnGYU7Vf1gKopU/edit?gid=0#gid=0)  

A ideia é que leia-se ela e atualize conforme ela está obvio.  

Eu penso que o principal é uma opção tipo caixa de texto aonde a pessoa coloca a URL base  

E depois tem tipo varias opções de boas classificações e checkboxs para a pessoa marcar e escolher quais utm's ela quer gerar.  

E por fim a saída disso é uma lista dos links pronto para copiar e colar (botão de copiar automático) para cada um dos links gerados. Apenas isso.  

Entidades mapeadas:  

Embaixadores -&gt; São todos e qualquer pessoa que pode vir dessa relação [LINK](https://docs.google.com/spreadsheets/d/1OyoE2ybG9Mcjuw8n4QjfGufPgu1kUjnGYU7Vf1gKopU/edit?gid=0#gid=0)

  
Interno : docs/interno\_[map.md](http://map.md)

E ter um opção de "criar", para casos isolados. As vezes uma ideia de template pronto fica bom.  
  
Importante ressaltar que hoje o sympla tem algumas coisas importantes como:  
  
entidades obrigatórias que nunca podem estar vazias{  
**URL Base**

**utm\_source**

**utm\_medium**

**utm\_campaign**

}  
entidades opcionais {

**utm\_content**

**utm\_term**

}  
  
O sympla deixa claro algumas coisas como{  
**utm\_source = Origem do trafego, onde o link sera clickado. E da opções pré prontas como "Instagram, face, google..."**  
  
**utm\_medium = Midia/canal como o trafego chegará, social, email, push...**  
  
**utm\_campaign = Nome da campanha. Identificador do lançamento ou promo; blackfriday, lancamento\_v2...**  
  
**utm\_content = Diferenciar links no mesmo anuncio, ex: botão\_topo, imagem\_01**  
  
**utm\_term = Para campanhas de pesquisa pagas. Ex: comprar+tenis**

}  
  
É interessante entender que não obrigatóriamente vamos seguiro padrao do sympla a risca, a ideia é adaptar ao nosso problema da melhor forma.  
  
Hoje na planilha de embaixadores seria ótimo eu separar por:

UF, MUNICIPIO, EMBAIXADA, EMBAIXADOR.

A outras variaveis como linkedin, email, celular e status não devem ser usadas dentro da UTM, porem...   


A variável "status" ela deve ser levado em consideração para a aplicação pois se um embaixador tem status = Desligado ou Pendente, ele não deve ser exibido, somente os que tiverem Ativo pode passar.



Sobre a lista do interno infelizmente por hora não vamos ter algo "online" para consultar, mas em algum momento pode haver.  
  
Enfim é isso.  
  
A ideia é como podemos condensar essas informações:  
(UF, MUNICIPIO, EMBAIXADA, EMBAIXADOR) naquelas utm.

Importante que o pessoal interno não tem esses membros atributos.  
Por exemplo alguém interno receberia ao invés de UF algo como "Interno" e afins.  
  
Enfim você vai me ajudar a mapear isso.

  