from typing import List, Optional
from pydantic import BaseModel, Field

class User(BaseModel):
    name: str
    gecos: Optional[str] = None
    groups: str = "sudo"
    shell: str = "/bin/bash"
    sudo: str = "ALL=(ALL) NOPASSWD:ALL"
    lock_passwd: bool = False
    ssh_authorized_keys: List[str] = Field(default_factory=list)
    password: Optional[str] = None

class NetworkInterface(BaseModel):
    name: str = "eth0"
    dhcp4: bool = True
    addresses: List[str] = Field(default_factory=list)
    gateway4: Optional[str] = None
    nameservers: List[str] = Field(default_factory=list)

class CloudConfig(BaseModel):
    instance_id: str = "iid-local01"
    hostname: str = "ubuntu"
    users: List[User] = Field(default_factory=list)
    
    # Root configuration
    root_enabled: bool = False
    root_password: Optional[str] = None
    root_ssh_keys: List[str] = Field(default_factory=list)
    root_ssh_pwauth: bool = False
    
    # Global SSH configuration
    ssh_pwauth: bool = False  # Default to False for better security
    
    # Regional Settings
    timezone: Optional[str] = None
    
    network_version: int = 2
    interfaces: List[NetworkInterface] = Field(default_factory=list)
