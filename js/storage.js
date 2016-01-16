/*requires treeDiagram*/

function unsave(diagramName, successCallback)
{
    //TODO: if loaded load something else or return to default paste instruction
    $.MessageBox({
        buttonDone  : "Yes",
        buttonFail  : "No",
        message     : "Are you sure you want to delete " + diagramName + "?"
    }).done(function(){
        var dataCollection = JSON.parse( localStorage.getItem('dataCollection') );
        var indexToRemove = dataCollection.map(function(x) {return x.diagramName; }).indexOf(diagramName);
        dataCollection.splice(indexToRemove, 1);
        localStorage.setItem('dataCollection', JSON.stringify(dataCollection));
        successCallback();
    });
}

function save()
{
    if (documentName === "")
        return;
    var dataCollection = JSON.parse( localStorage.getItem('dataCollection') );

    var toStore = {
        diagramName: documentName,
        clauses: []
    };
    $(".sentence").each(function(){
        var t = $(this);
        var d = {
            text: t.html(),
            lineName: t.attr("data-line-name"),
            lineIndex: t.attr("data-line-index"),
            indentLevel: (parseInt(t.css("paddingLeft")) - 3) / 30,
            reason: t.attr("data-reason"),
            parent: t.attr("data-parent")
        };
        // if (typeof toStore.clauses == "undefined")
        //     toStore.clauses = [];
        toStore.clauses.push(d);
    });

    var elementPos = -1;
    if (dataCollection === null)
    {
        dataCollection = [];
    }
    else {
        elementPos = dataCollection.map(function(x) {return x.diagramName; }).indexOf(documentName);
    }
    if (elementPos > -1)
        dataCollection[elementPos] = toStore;
    else
        dataCollection.push(toStore);
    localStorage.setItem('dataCollection', JSON.stringify(dataCollection));
}

function restore(diagramName)
{
    var dataCollection = JSON.parse( localStorage.getItem('dataCollection') );
    var elementPos = dataCollection.map(function(x) {return x.diagramName; }).indexOf(diagramName);
    if (elementPos == -1)
        return;
    $diagram.empty();
    $(".anchor").hide();
    dataCollection[elementPos].clauses.forEach(function(clause){
        var p = $("<p>").addClass("sentence")
        .html(clause.text)
        .css("paddingLeft", clause.indentLevel * 30 + 3)
        .attr("data-line-name", clause.lineName)
        .attr("data-line-index", clause.lineIndex)
        .attr("data-reason", clause.reason)
        .attr("data-parent", clause.parent);
        $diagram.append(p);
    });
    treeDiagram = new Diagram($(".word").toArray());
    documentName = diagramName;
}

function autoSave()
{
    window.clearTimeout(documentTimer);
    documentTimer = window.setTimeout(function(){
        save();
    }, 500);
}
