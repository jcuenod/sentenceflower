function Diagram (elements)
{
    this.clauses = [];
    this.clauses.push(new Clause(elements));
}

Diagram.prototype.splitClause = function (clauseIndex, elementIndex) {
    var brokenClause = this.clauses.pop(clauseIndex).splitClause(elementIndex);
    this.clauses = this.clauses.injectArray(clauseIndex, brokenClause);
};
Diagram.prototype.mergeClauseBackward = function(clauseIndex)  {
    if (clauseIndex <= 0)
        return false;
    console.log(this.clauses[clauseIndex - 1]);
    this.clauses[clauseIndex - 1].appendClauseToClause(this.clauses[clauseIndex]);
    this.clauses.splice(clauseIndex, 1);
    console.log(this.clauses[clauseIndex - 1]);
};
Diagram.prototype.setTreeParent = function (clauseIndex, parentIndex) {
    this.clauses[clauseIndex].treeParent = this.clauses[parentIndex];
};



function Clause (clauseElements) {
    this.elements = clauseElements;
    this.indentLevel = 0;
    this.treeParent = null;
    this.parent = null;
    this.children = [];
}

Clause.prototype.splitClause = function (index) {
    return [new Clause(this.elements.slice(0,index)), new Clause (this.elements.slice(index))];
};
Clause.prototype.appendClauseToClause = function (clauseToAppend) {
    this.elements = this.elements.concat(clauseToAppend.elements);
};
Clause.prototype.setIndentLevel = function (newIndentLevel) {
    this.indentLevel = indentLevel;
};
Clause.prototype.setParent = function (newParent) {
    this.parent = newParent;
};
Clause.prototype.addChild = function (child) {
    this.children.push(child);
    this.children.sort();
};
Clause.prototype.removeChild = function (child) {
    var index = this.children.indexOf(child);
    if (index > -1)
        array.splice(index, 1);
};


Array.prototype.injectArray = function( idx, arr ) {
    return this.slice( 0, idx ).concat( arr ).concat( this.slice( idx ) );
};
