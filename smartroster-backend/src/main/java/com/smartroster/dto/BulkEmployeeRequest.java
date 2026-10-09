package com.smartroster.dto;

import java.util.List;

public class BulkEmployeeRequest {
    private List<String> names;

    public BulkEmployeeRequest() {}
    public BulkEmployeeRequest(List<String> names) { this.names = names; }

    public List<String> getNames() { return names; }
    public void setNames(List<String> names) { this.names = names; }
}
