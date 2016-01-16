var isIe = (navigator.userAgent.toLowerCase().indexOf("msie") != -1 || navigator.userAgent.toLowerCase().indexOf("trident") != -1);

var documentTimer;
var documentName = "";
var sentenceDepth = 0;
var initIndent = 0;
var treeDiagram = null;
var $diagram = null;
var dragTarget = null;
var $anchorAssociation = null;
var subordinateReasonList = [{
    text: 'Argumentation',
    children: [
        { id: 1, text: "Concession" },
        { id: 2, text: "Condition" },
        { id: 3, text: "Means" },
        { id: 4, text: "Purpose" },
        { id: 5, text: "Reason/Basis" },
        { id: 6, text: "Result" }
    ]
}, {
    text: 'Orientation',
    children: [
        { id: 7, text: "Content" },
        { id: 8, text: "Time" },
        { id: 9, text: "Location" },
        { id: 10, text: "Circumstance" }
    ]
}, {
    text: 'Clarification',
    children: [
        { id: 11, text: "Identification" },
        { id: 12, text: "Comment" },
        { id: 13, text: "Amplification" },
        { id: 14, text: "Manner" },
        { id: 15, text: "Comparison" },
        { id: 16, text: "Contrast" }
    ]
}];
var coordinateReasonList = [{
    text: 'Coordinate Relationships',
    children: [
        { id: 17, text: "Alternative" },
        { id: 18, text: "Sequential" },
        { id: 19, text: "Simultaneous/Parallel" }
    ]
}];

$(document).ready(function(){
    $diagram = $(".diagram");
    $(".reasonInput").selectivity({
        showSearchInputInDropdown: false,
        items: subordinateReasonList,
        placeholder: 'Reason'
    });
    $('li.load').hover(
        function () {
            var $loadopt = $(".loadoption");
            if ($loadopt.length === 0)
            {
                var dataCollection = JSON.parse( localStorage.getItem('dataCollection') );
                if (dataCollection === null)
                    return;
                var $options = $("<ul>").addClass("loadoption");
                var options = [];
                dataCollection.map(function(x) {
                    options.push(x.diagramName);
                });
                options.sort();
                options.forEach(function(x){
                    $("<li>").appendTo($options).append($("<a href=#>").text(x));
                });
                $(this).append($options.css({marginTop: 10, opacity: 0}));
            }
            $('ul', this).show();
            $('ul', this).stop().animate({marginTop: 3, opacity: 1}, 100);
        },
        function () {
            $('ul', this).stop().animate({marginTop: 10, opacity: 0}, 100, "swing", function(){ $(this).hide(); });
        }
    );
    $(".anchor").hide();
    autoSave();
});

function pasteThings(things)
{
    var words = things.replace(/(\d+)/g,' <sup>$1</sup>').trim().split(" ");
    paragraph = $("<p>").addClass("sentence");
    $.each(words, function(i, word) {
        paragraph.append($("<span>").addClass("word").html(word + " "));
    });
    $diagram.empty().append(paragraph);
    labelLine(paragraph);
    treeDiagram = new Diagram($(".word").toArray());

    $.MessageBox({
        input    : true,
        message  : "Please choose a name for this document (it will be autosaved)"
    }).done(function(data){
        var trimmedData = $.trim(data);
        if (trimmedData) {
            documentName = trimmedData;
            save();
            $(".loadoption").remove();
        } else {
            $.MessageBox("Okay, that's problematic...\nYou're only causing issues for yourself you know");
        }
    });
}
$(document).on("paste", function(e){
    var textFromClipboard = "";
    if (isIe) {
        textFromClipboard = window.clipboardData.getData('Text');
    } else {
        textFromClipboard = e.originalEvent.clipboardData.getData('text/plain');
    }
    if (true)//confirm('paste?'))
        pasteThings(textFromClipboard);
    e.preventDefault();
}).on("contextmenu", ".word", function (e) {
    domControlRemoveClause(this);
    e.preventDefault();
    return false;
}).on("click", ".loadoption a", function(e){
    restore($(this).text());
}).on("click", ".anchor a", function(e){
    $anchorAssociation.attr("data-parent", $(this).text());
    var reasonsToUse = subordinateReasonList;
    if ($anchorAssociation.css("paddingLeft") == getSentenceFromName($(this).text()).css("paddingLeft"))
        reasonsToUse = coordinateReasonList;
    showReasonPicker(e, reasonsToUse);
}).on("click", ".word", function(){
    domControlAddClause(this);
}).on("dragstart", ".sentence", function( ev, dd ){
    initIndent = parseInt($(this).css("paddingLeft"), 10);
    dragTarget = ev.currentTarget;
    $(".anchor").hide();
}).on("drag", ".sentence", function( ev, dd ){
    $(dragTarget).css({ paddingLeft: initIndent + Math.round( dd.offsetX / 30 ) * 30 });
    repositionAnchor($(this));
}).on("dragend", ".sentence", function(){
    dragTarget = null;
    repositionAnchor($(this));
    autoSave();
}).on("mouseenter", ".sentence", function(){
    repositionAnchor($(this));
}).on("mouseenter", ".anchor", function(){
    var possibleAnchors = findPossibleRelationships($anchorAssociation);
    var $sentences = $(".sentence");
    var $ul = $(".anchor ul").empty();
    possibleAnchors.forEach(function(pA) {
        $ul.append(
            $("<li>").append(
                $("<a href=# class='anchorSelect'>").text(getNameFromSentence($($sentences.get(pA))))
            )
        );
    });
}).on("mouseenter", ".anchorSelect", function(){
    $(".highlightParent").removeClass("highlightParent");
    getSentenceFromName($(this).text()).addClass("highlightParent");
}).on("mouseleave", ".anchorSelect", function(){
    $(".highlightParent").removeClass("highlightParent");
}).on("selectivity-close", ".reasonInput", function(){
    $(".reasonPicker").removeClass("showPicker");
}).on("selectivity-selected", ".reasonInput", function(e){
    $anchorAssociation.attr("data-reason", e.item.text);
    autoSave();
});

function repositionAnchor($sentence)
{
    if (dragTarget !== null)
    {
        return;
    }
    if (parseInt($sentence.css("paddingLeft"), 10) < 30)
    {
        $(".anchor").hide();
        return;
    }
    var firstWordOffset = $sentence.children().first().offset();
    $(".anchor").css({ left: firstWordOffset.left - 30, top: firstWordOffset.top });
    $(".anchor").fadeIn("fast");
    $anchorAssociation = $sentence;
}

function showReasonPicker(e, reasons)
{
    $(".reasonInput").selectivity("setOptions", {items: reasons});
    //TODO: show coordinateReasonList when appropriate
    var width = $(".reasonPicker").outerWidth();
    var height = $(".reasonPicker").outerHeight();
    $(".reasonPicker").css({ left: e.clientX - width/2, top: e.clientY - height /2 });
    $(".reasonPicker").addClass("showPicker");
    $(".reasonInput").selectivity("open");
}

function labelLine($clause)
{
    var indexOffset = $clause.prevAll("[data-line-name]").first().index();
    indexOffset = indexOffset > -1 ? indexOffset : 0;
    var thisIndex = $clause.index();
    if (typeof $clause.attr("data-line-name") !== "undefined")
        indexOffset = thisIndex;
    $clause.attr("data-line-index", String.fromCharCode(97 + thisIndex - indexOffset));

    var $firstChild = $clause.children(":first");
    var name = $firstChild.text().match(/^\d+/);
    if (name !== null)
    {
        $clause.attr("data-line-name", name);
        $clause.attr("data-line-index", "a");
        indexOffset = thisIndex;
        $firstChild.text($firstChild.text().replace(/^\d+(.*)/, "$1"));
    }
    if ($clause.next("[data-line-name]").length === 0)
    {
        $clause.nextUntil("[data-line-name]").each(function(i, el){
            $(el).attr("data-line-index", String.fromCharCode(97 + thisIndex + i + 1 - indexOffset));
        });
    }
}

function domControlRemoveClause(that)
{
    var clauseIndex = $(that).parent().index();
    // var clauseIndex = $diagram.children().index($(that).parent());
    var elementIndex = $(that).index();
    var currentP = $(that).parent();
    var targetP = $(that).parent().prev();
    if (targetP.length > 0)
    {
        if (typeof currentP.attr("data-line-name") !== "undefined")
            $(that).siblings().first().prepend($("<sup>").text(currentP.attr("data-line-name")));
        targetP.append($(that).siblings().andSelf().detach());
        treeDiagram.mergeClauseBackward(clauseIndex, elementIndex);
        currentP.remove();
        labelLine(targetP.next());
    }
    autoSave();
}
function domControlAddClause(that)
{
    var clauseIndex = $(that).parent().index();
    var elementIndex = $(that).index();
    var currentP = $(that).parent();
    var newP = $("<p>").addClass("sentence");
    if ($(that).prevAll().length > 0)
    {
        newP.append($(that).nextAll().andSelf().detach()).insertAfter(currentP);
        newP.css({ paddingLeft: currentP.css("paddingLeft") });

        labelLine(newP);

        treeDiagram.splitClause(clauseIndex, elementIndex);
    }
    autoSave();
}

function getNameFromSentence($sentence)
{
    var linename = $sentence.attr("data-line-name");
    if (typeof linename === "undefined")
        linename = $sentence.prevAll("[data-line-name]").first().attr("data-line-name");
    var thisIndex = $sentence.attr("data-line-index");
    return linename + '' + thisIndex;
}
function getSentenceFromName(name)
{
    var linename = name.match(/^\d+/)[0];
    var thisIndex = name.match(/[A-Za-z]+$/)[0];
    var line = $(".sentence[data-line-name='" + linename + "']");
    if (line.filter("[data-line-index='" + thisIndex + "']").length > 0)
        return line;
    return line.nextAll("[data-line-index='" + thisIndex + "']").first();
}

function findCoordinateSentenceByDirection($that, $maybe, directionFunction) {
    $maybe = directionFunction($maybe);
    if ($maybe.length === 0)
        return -1;
    var thatPadding = parseInt($that.css("paddingLeft"), 10);
    var maybePadding = parseInt($maybe.css("paddingLeft"), 10);
    if (thatPadding > maybePadding)
    {
        return -1;
    }
    else if (thatPadding === maybePadding)
    {
        return $maybe;
    }
    else
    {
        return findCoordinateSentenceByDirection($that, $maybe, directionFunction);
    }
}
function findParentSentenceByDirection($that, $maybe, directionFunction) {
    $maybe = directionFunction($maybe);
    if ($maybe.length === 0)
        return -1;
    var thatPadding = parseInt($that.css("paddingLeft"), 10);
    var maybePadding = parseInt($maybe.css("paddingLeft"), 10);
    return thatPadding > maybePadding ? $maybe : findParentSentenceByDirection($that, $maybe, directionFunction);
}
function findPossibleRelationships($sentence) {
    var possibleParents = [];
    var nextDirection = function(el) { return $(el).next(); };
    var prevDirection = function(el) { return $(el).prev(); };

    var directions = [nextDirection, prevDirection];

    var lookADirection = function(direction){
        var newPossibilities = [];
        var newPossibility = null;
        for (var possibility = findParentSentenceByDirection($sentence, $sentence, direction); possibility !== -1; possibility = findParentSentenceByDirection(newPossibility, newPossibility, direction))
        {
            newPossibilities.push(possibility.index());
            newPossibility = possibility;
        }
        return newPossibilities;
    };

    var coord = findCoordinateSentenceByDirection($sentence, $sentence, prevDirection);
    if (coord !== -1)
    {
        possibleParents.push(coord.index());
    }
    else {
        possibleParents = possibleParents.concat(lookADirection(prevDirection));
    }
    if (findCoordinateSentenceByDirection($sentence, $sentence, nextDirection) === -1)
    {
        var nextPoss = lookADirection(nextDirection);
        if (nextPoss.length > 0)
            possibleParents.push(lookADirection(nextDirection)[0]);
    }
    return possibleParents;
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
